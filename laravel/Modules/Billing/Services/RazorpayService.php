<?php

declare(strict_types=1);

namespace Modules\Billing\Services;

use Carbon\Carbon;
use InvalidArgumentException;
use Modules\Billing\Enums\SubscriptionStatus;
use Modules\Billing\Models\Subscription;
use Modules\Tenant\Models\Tenant;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;
use RuntimeException;
use Throwable;

class RazorpayService
{
    private ?Api $api = null;

    public function __construct(
        private readonly ?Api $apiOverride = null,
    ) {
    }

    /**
     * Create a Razorpay subscription for the tenant and persist a local record.
     *
     * @return array{
     *     subscription_id: string,
     *     razorpay_subscription_id: string,
     *     razorpay_plan_id: string,
     *     status: string,
     *     subscription: Subscription
     * }
     */
    public function createSubscription(Tenant $tenant, string $planId): array
    {
        $planId = trim($planId);

        if ($planId === '') {
            throw new InvalidArgumentException('Razorpay plan id is required.');
        }

        try {
            $razorpaySubscription = $this->client()->subscription->create([
                'plan_id' => $planId,
                'total_count' => (int) config('billing.config.razorpay.default_total_count', 12),
                'customer_notify' => (int) config('billing.config.razorpay.customer_notify', 1),
                'notes' => [
                    'tenant_id' => (string) $tenant->id,
                    'tenant_name' => $tenant->name,
                ],
            ]);
        } catch (Throwable $exception) {
            throw new RuntimeException(
                'Unable to create Razorpay subscription: '.$exception->getMessage(),
                previous: $exception
            );
        }

        $razorpaySubscriptionId = (string) ($razorpaySubscription['id'] ?? '');

        if ($razorpaySubscriptionId === '') {
            throw new RuntimeException('Razorpay did not return a subscription id.');
        }

        $status = SubscriptionStatus::tryFrom((string) ($razorpaySubscription['status'] ?? ''))
            ?? SubscriptionStatus::Created;

        $subscription = Subscription::query()->updateOrCreate(
            ['razorpay_subscription_id' => $razorpaySubscriptionId],
            [
                'tenant_id' => $tenant->id,
                'razorpay_plan_id' => (string) ($razorpaySubscription['plan_id'] ?? $planId),
                'status' => $status,
                'current_term_start' => $this->timestampOrNull($razorpaySubscription['current_start'] ?? null),
                'current_term_end' => $this->timestampOrNull($razorpaySubscription['current_end'] ?? null),
            ]
        );

        return [
            'subscription_id' => $razorpaySubscriptionId,
            'razorpay_subscription_id' => $razorpaySubscriptionId,
            'razorpay_plan_id' => $subscription->razorpay_plan_id,
            'status' => $subscription->status->value,
            'subscription' => $subscription,
        ];
    }

    /**
     * Verify a Razorpay webhook HMAC using the raw request body.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = (string) config('billing.config.razorpay.webhook_secret');

        if ($secret === '') {
            throw new RuntimeException('RAZORPAY_WEBHOOK_SECRET (or RAZORPAY_SECRET) is not configured.');
        }

        if ($payload === '' || $signature === '') {
            return false;
        }

        try {
            $this->client()->utility->verifyWebhookSignature($payload, $signature, $secret);

            return true;
        } catch (SignatureVerificationError) {
            return false;
        }
    }

    /**
     * Verify Razorpay payment callback signature and/or webhook signature.
     *
     * Payment attributes expect razorpay_payment_id, razorpay_signature, and one of
     * razorpay_order_id / razorpay_subscription_id / razorpay_payment_link_id.
     *
     * Webhook attributes expect `payload` (raw body) and `signature` (X-Razorpay-Signature).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function verifyPaymentSignature(array $attributes): bool
    {
        try {
            if (isset($attributes['payload'], $attributes['signature'])) {
                return $this->verifyWebhookSignature(
                    (string) $attributes['payload'],
                    (string) $attributes['signature']
                );
            }

            $this->client()->utility->verifyPaymentSignature($attributes);

            return true;
        } catch (SignatureVerificationError) {
            return false;
        } catch (RuntimeException $exception) {
            throw $exception;
        }
    }

    /**
     * Apply a verified Razorpay webhook payload to the local subscription row.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleWebhookPayload(array $payload): ?Subscription
    {
        $event = (string) ($payload['event'] ?? '');

        /** @var array<string, mixed>|mixed $entity */
        $entity = data_get($payload, 'payload.subscription.entity', []);

        if (! is_array($entity) || $entity === []) {
            return null;
        }

        $razorpaySubscriptionId = (string) ($entity['id'] ?? '');

        if ($razorpaySubscriptionId === '') {
            return null;
        }

        $subscription = Subscription::query()
            ->where('razorpay_subscription_id', $razorpaySubscriptionId)
            ->first();

        if ($subscription === null) {
            $tenantId = (int) data_get($entity, 'notes.tenant_id', 0);

            if ($tenantId <= 0 || ! Tenant::query()->whereKey($tenantId)->exists()) {
                return null;
            }

            $subscription = new Subscription([
                'tenant_id' => $tenantId,
                'razorpay_subscription_id' => $razorpaySubscriptionId,
                'razorpay_plan_id' => (string) ($entity['plan_id'] ?? ''),
                'status' => SubscriptionStatus::Created,
            ]);
        }

        $status = SubscriptionStatus::fromWebhookEvent($event);

        if ($status !== null) {
            $subscription->status = $status;
        } elseif (isset($entity['status'])) {
            $mapped = SubscriptionStatus::tryFrom((string) $entity['status']);

            if ($mapped !== null) {
                $subscription->status = $mapped;
            }
        }

        if (isset($entity['plan_id']) && is_string($entity['plan_id']) && $entity['plan_id'] !== '') {
            $subscription->razorpay_plan_id = $entity['plan_id'];
        }

        $subscription->current_term_start = $this->timestampOrNull($entity['current_start'] ?? null);
        $subscription->current_term_end = $this->timestampOrNull($entity['current_end'] ?? null);
        $subscription->save();

        return $subscription->fresh();
    }

    private function client(): Api
    {
        if ($this->apiOverride !== null) {
            return $this->apiOverride;
        }

        if ($this->api !== null) {
            return $this->api;
        }

        $key = (string) config('billing.config.razorpay.key');
        $secret = (string) config('billing.config.razorpay.secret');

        if ($key === '' || $secret === '') {
            throw new RuntimeException('RAZORPAY_KEY and RAZORPAY_SECRET must be configured.');
        }

        return $this->api = new Api($key, $secret);
    }

    private function timestampOrNull(mixed $value): ?Carbon
    {
        if ($value === null || $value === '' || $value === 0 || $value === '0') {
            return null;
        }

        if (is_numeric($value)) {
            return Carbon::createFromTimestamp((int) $value);
        }

        return Carbon::parse((string) $value);
    }
}
