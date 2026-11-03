<?php

declare(strict_types=1);

namespace Modules\Billing\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Libinkk\ApiStarter\Facades\Api;
use Modules\Billing\Requests\SubscribeRequest;
use Modules\Billing\Services\RazorpayService;
use Modules\Tenant\Models\Tenant;
use RuntimeException;
use Throwable;

class BillingController extends Controller
{
    public function __construct(
        private readonly RazorpayService $razorpayService,
    ) {}

    /**
     * Start a Razorpay subscription for the authenticated user's tenant.
     */
    public function subscribe(SubscribeRequest $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            if ($user->tenant_id === null) {
                return Api::error(
                    'Your account is not linked to a tenant.',
                    422,
                    [],
                    [],
                    'BILLING_TENANT_REQUIRED'
                );
            }

            /** @var Tenant|null $tenant */
            $tenant = Tenant::query()->find($user->tenant_id);

            if ($tenant === null) {
                return Api::error(
                    'Tenant not found for the authenticated user.',
                    404,
                    [],
                    [],
                    'BILLING_TENANT_NOT_FOUND'
                );
            }

            $result = $this->razorpayService->createSubscription($tenant, $request->planId());

            return Api::created(
                [
                    'subscription_id' => $result['subscription_id'],
                    'razorpay_subscription_id' => $result['razorpay_subscription_id'],
                    'razorpay_plan_id' => $result['razorpay_plan_id'],
                    'status' => $result['status'],
                    'local_subscription_id' => $result['subscription']->id,
                    'tenant_id' => $tenant->id,
                ],
                'Subscription created successfully'
            );
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (InvalidArgumentException $exception) {
            return Api::validation(
                ['plan_id' => [$exception->getMessage()]],
                'Validation failed.',
                422
            );
        } catch (RuntimeException $exception) {
            report($exception);

            return Api::error(
                $exception->getMessage(),
                502,
                [],
                [],
                'BILLING_RAZORPAY_FAILED'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to create subscription. Please try again later.',
                500,
                [],
                [],
                'BILLING_SUBSCRIBE_FAILED'
            );
        }
    }

    /**
     * Public Razorpay webhook receiver.
     *
     * Configure the Razorpay dashboard to POST subscription lifecycle events to
     * POST /api/v1/billing/webhook with the webhook secret in RAZORPAY_WEBHOOK_SECRET.
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            $payload = $request->getContent();
            $signature = (string) $request->header('X-Razorpay-Signature', '');

            if ($payload === '' || $signature === '') {
                return Api::error(
                    'Missing webhook payload or signature.',
                    400,
                    [],
                    [],
                    'BILLING_WEBHOOK_INVALID'
                );
            }

            try {
                $verified = $this->razorpayService->verifyWebhookSignature($payload, $signature);
            } catch (RuntimeException $exception) {
                report($exception);

                return Api::error(
                    $exception->getMessage(),
                    503,
                    [],
                    [],
                    'BILLING_WEBHOOK_MISCONFIGURED'
                );
            }

            if (! $verified) {
                return Api::error(
                    'Invalid Razorpay webhook signature.',
                    400,
                    [],
                    [],
                    'BILLING_WEBHOOK_SIGNATURE_INVALID'
                );
            }

            /** @var array<string, mixed> $decoded */
            $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
            $event = (string) ($decoded['event'] ?? '');

            $subscription = $this->razorpayService->handleWebhookPayload($decoded);

            if ($subscription === null) {
                return Api::success(
                    [
                        'handled' => false,
                        'event' => $event !== '' ? $event : null,
                    ],
                    'Webhook acknowledged without subscription update'
                );
            }

            return Api::success(
                [
                    'handled' => true,
                    'event' => $event !== '' ? $event : null,
                    'subscription_id' => $subscription->razorpay_subscription_id,
                    'status' => $subscription->status->value,
                    'local_subscription_id' => $subscription->id,
                ],
                'Webhook processed successfully'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to process Razorpay webhook.',
                500,
                [],
                [],
                'BILLING_WEBHOOK_FAILED'
            );
        }
    }
}
