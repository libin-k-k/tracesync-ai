<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Mockery\MockInterface;
use Modules\Billing\Enums\SubscriptionStatus;
use Modules\Billing\Models\Subscription;
use Modules\Billing\Services\RazorpayService;
use Modules\Tenant\Models\Tenant;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BillingControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Tenant}
     */
    private function actingAsTenantUser(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($user);

        return [$user, $tenant];
    }

    /**
     * @return MockInterface&RazorpayService
     */
    private function mockRazorpayService(): MockInterface
    {
        /** @var MockInterface&RazorpayService $mock */
        $mock = Mockery::mock(RazorpayService::class);
        $this->app->instance(RazorpayService::class, $mock);

        return $mock;
    }

    #[Test]
    public function it_requires_authentication_to_subscribe(): void
    {
        $response = $this->postJson('/api/v1/billing/subscribe', [
            'plan_id' => 'plan_pro_monthly',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertUnauthorized();
    }

    #[Test]
    public function it_validates_plan_id_when_subscribing(): void
    {
        $this->actingAsTenantUser();

        $response = $this->postJson('/api/v1/billing/subscribe', [], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['plan_id'], 'errors');
    }

    #[Test]
    public function it_creates_a_subscription_for_the_authenticated_tenant(): void
    {
        [, $tenant] = $this->actingAsTenantUser(
            Tenant::factory()->create(['name' => 'Acme Billing Co'])
        );

        $local = Subscription::factory()->make([
            'tenant_id' => $tenant->id,
            'razorpay_subscription_id' => 'sub_test_123',
            'razorpay_plan_id' => 'plan_pro_monthly',
            'status' => SubscriptionStatus::Created,
        ]);
        $local->id = 42;

        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('createSubscription')
            ->once()
            ->withArgs(function (Tenant $receivedTenant, string $planId) use ($tenant): bool {
                return $receivedTenant->id === $tenant->id && $planId === 'plan_pro_monthly';
            })
            ->andReturn([
                'subscription_id' => 'sub_test_123',
                'razorpay_subscription_id' => 'sub_test_123',
                'razorpay_plan_id' => 'plan_pro_monthly',
                'status' => SubscriptionStatus::Created->value,
                'subscription' => $local,
            ]);

        $response = $this->postJson('/api/v1/billing/subscribe', [
            'plan_id' => 'plan_pro_monthly',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('message', 'Subscription created successfully')
            ->assertJsonPath('data.subscription_id', 'sub_test_123')
            ->assertJsonPath('data.razorpay_subscription_id', 'sub_test_123')
            ->assertJsonPath('data.razorpay_plan_id', 'plan_pro_monthly')
            ->assertJsonPath('data.status', 'created')
            ->assertJsonPath('data.tenant_id', $tenant->id)
            ->assertJsonPath('data.local_subscription_id', 42);
    }

    #[Test]
    public function it_rejects_subscribe_when_user_has_no_tenant(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        Sanctum::actingAs($user);

        $mock = $this->mockRazorpayService();
        $mock->shouldNotReceive('createSubscription');

        $response = $this->postJson('/api/v1/billing/subscribe', [
            'plan_id' => 'plan_pro_monthly',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'BILLING_TENANT_REQUIRED');
    }

    #[Test]
    public function it_returns_gateway_error_when_razorpay_service_fails(): void
    {
        $this->actingAsTenantUser();

        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('createSubscription')
            ->once()
            ->andThrow(new \RuntimeException('Unable to create Razorpay subscription: gateway down'));

        $response = $this->postJson('/api/v1/billing/subscribe', [
            'plan_id' => 'plan_pro_monthly',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertStatus(502)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'BILLING_RAZORPAY_FAILED')
            ->assertJsonPath('message', 'Unable to create Razorpay subscription: gateway down');
    }

    #[Test]
    public function webhook_rejects_missing_signature(): void
    {
        $mock = $this->mockRazorpayService();
        $mock->shouldNotReceive('verifyWebhookSignature');

        $response = $this->postJson('/api/v1/billing/webhook', [
            'event' => 'subscription.charged',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'BILLING_WEBHOOK_INVALID');
    }

    #[Test]
    public function webhook_rejects_invalid_signature(): void
    {
        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('verifyWebhookSignature')
            ->once()
            ->andReturn(false);

        $payload = json_encode([
            'event' => 'subscription.charged',
            'payload' => [
                'subscription' => [
                    'entity' => [
                        'id' => 'sub_test_123',
                        'status' => 'active',
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $response = $this->call(
            'POST',
            '/api/v1/billing/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_X_API_VERSION' => 'v1',
                'HTTP_X_RAZORPAY_SIGNATURE' => 'bad-signature',
            ],
            $payload
        );

        $response->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'BILLING_WEBHOOK_SIGNATURE_INVALID');
    }

    #[Test]
    public function webhook_marks_subscription_active_on_charged_event(): void
    {
        $tenant = Tenant::factory()->create();
        $subscription = Subscription::factory()->create([
            'tenant_id' => $tenant->id,
            'razorpay_subscription_id' => 'sub_live_abc',
            'razorpay_plan_id' => 'plan_pro_monthly',
            'status' => SubscriptionStatus::Created,
        ]);

        $termStart = now()->subHour()->timestamp;
        $termEnd = now()->addMonth()->timestamp;

        $payloadArray = [
            'event' => 'subscription.charged',
            'payload' => [
                'subscription' => [
                    'entity' => [
                        'id' => 'sub_live_abc',
                        'plan_id' => 'plan_pro_monthly',
                        'status' => 'active',
                        'current_start' => $termStart,
                        'current_end' => $termEnd,
                        'notes' => [
                            'tenant_id' => (string) $tenant->id,
                        ],
                    ],
                ],
            ],
        ];

        $payload = json_encode($payloadArray, JSON_THROW_ON_ERROR);

        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('verifyWebhookSignature')
            ->once()
            ->withArgs(function (string $body, string $signature) use ($payload): bool {
                return $body === $payload && $signature === 'valid-signature';
            })
            ->andReturn(true);

        $mock->shouldReceive('handleWebhookPayload')
            ->once()
            ->withArgs(function (array $decoded) use ($payloadArray): bool {
                return ($decoded['event'] ?? null) === $payloadArray['event']
                    && data_get($decoded, 'payload.subscription.entity.id') === 'sub_live_abc';
            })
            ->andReturnUsing(function () use ($subscription, $termStart, $termEnd): Subscription {
                $subscription->status = SubscriptionStatus::Active;
                $subscription->current_term_start = \Illuminate\Support\Carbon::createFromTimestamp($termStart);
                $subscription->current_term_end = \Illuminate\Support\Carbon::createFromTimestamp($termEnd);
                $subscription->save();

                return $subscription->fresh();
            });

        $response = $this->call(
            'POST',
            '/api/v1/billing/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_X_API_VERSION' => 'v1',
                'HTTP_X_RAZORPAY_SIGNATURE' => 'valid-signature',
            ],
            $payload
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Webhook processed successfully')
            ->assertJsonPath('data.handled', true)
            ->assertJsonPath('data.subscription_id', 'sub_live_abc')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('subscriptions', [
            'id' => $subscription->id,
            'status' => SubscriptionStatus::Active->value,
        ]);
    }

    #[Test]
    public function webhook_marks_subscription_halted_on_halted_event(): void
    {
        $subscription = Subscription::factory()->active()->create([
            'razorpay_subscription_id' => 'sub_halt_me',
        ]);

        $payload = json_encode([
            'event' => 'subscription.halted',
            'payload' => [
                'subscription' => [
                    'entity' => [
                        'id' => 'sub_halt_me',
                        'status' => 'halted',
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('verifyWebhookSignature')->once()->andReturn(true);
        $mock->shouldReceive('handleWebhookPayload')
            ->once()
            ->andReturnUsing(function () use ($subscription): Subscription {
                $subscription->status = SubscriptionStatus::Halted;
                $subscription->save();

                return $subscription->fresh();
            });

        $response = $this->call(
            'POST',
            '/api/v1/billing/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_X_API_VERSION' => 'v1',
                'HTTP_X_RAZORPAY_SIGNATURE' => 'valid-signature',
            ],
            $payload
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'halted');

        $this->assertDatabaseHas('subscriptions', [
            'id' => $subscription->id,
            'status' => SubscriptionStatus::Halted->value,
        ]);
    }

    #[Test]
    public function webhook_is_public_and_does_not_require_auth(): void
    {
        $mock = $this->mockRazorpayService();
        $mock->shouldReceive('verifyWebhookSignature')->once()->andReturn(true);
        $mock->shouldReceive('handleWebhookPayload')->once()->andReturn(null);

        $payload = json_encode([
            'event' => 'payment.authorized',
            'payload' => [],
        ], JSON_THROW_ON_ERROR);

        $response = $this->call(
            'POST',
            '/api/v1/billing/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_X_API_VERSION' => 'v1',
                'HTTP_X_RAZORPAY_SIGNATURE' => 'valid-signature',
            ],
            $payload
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.handled', false);
    }
}
