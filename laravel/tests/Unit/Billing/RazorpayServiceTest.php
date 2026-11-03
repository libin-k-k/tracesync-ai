<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Enums\SubscriptionStatus;
use Modules\Billing\Models\Subscription;
use Modules\Billing\Services\RazorpayService;
use Modules\Tenant\Models\Tenant;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RazorpayServiceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_verifies_a_valid_webhook_signature(): void
    {
        $secret = 'whsec_test_secret';
        config([
            'billing.config.razorpay.key' => 'rzp_test_key',
            'billing.config.razorpay.secret' => 'rzp_test_secret',
            'billing.config.razorpay.webhook_secret' => $secret,
        ]);

        $payload = '{"event":"subscription.charged"}';
        $signature = hash_hmac('sha256', $payload, $secret);

        $service = new RazorpayService();

        $this->assertTrue($service->verifyPaymentSignature([
            'payload' => $payload,
            'signature' => $signature,
        ]));
    }

    #[Test]
    public function it_rejects_an_invalid_webhook_signature(): void
    {
        config([
            'billing.config.razorpay.key' => 'rzp_test_key',
            'billing.config.razorpay.secret' => 'rzp_test_secret',
            'billing.config.razorpay.webhook_secret' => 'whsec_test_secret',
        ]);

        $service = new RazorpayService();

        $this->assertFalse($service->verifyPaymentSignature([
            'payload' => '{"event":"subscription.charged"}',
            'signature' => 'not-a-real-signature',
        ]));
    }

    #[Test]
    public function it_updates_subscription_status_from_webhook_payload(): void
    {
        $tenant = Tenant::factory()->create();
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'razorpay_subscription_id' => 'sub_unit_1',
            'status' => SubscriptionStatus::Created,
        ]);

        $service = new RazorpayService();

        $updated = $service->handleWebhookPayload([
            'event' => 'subscription.halted',
            'payload' => [
                'subscription' => [
                    'entity' => [
                        'id' => 'sub_unit_1',
                        'plan_id' => 'plan_pro_monthly',
                        'status' => 'halted',
                        'current_start' => now()->subDay()->timestamp,
                        'current_end' => now()->addDays(10)->timestamp,
                    ],
                ],
            ],
        ]);

        $this->assertNotNull($updated);
        $this->assertSame($subscription->id, $updated->id);
        $this->assertSame(SubscriptionStatus::Halted, $updated->status);
        $this->assertNotNull($updated->current_term_start);
        $this->assertNotNull($updated->current_term_end);
    }
}
