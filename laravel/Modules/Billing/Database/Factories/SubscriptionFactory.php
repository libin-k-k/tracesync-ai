<?php

declare(strict_types=1);

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Enums\SubscriptionStatus;
use Modules\Billing\Models\Subscription;
use Modules\Tenant\Models\Tenant;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'razorpay_subscription_id' => 'sub_'.fake()->unique()->bothify('????????????????'),
            'razorpay_plan_id' => 'plan_'.fake()->bothify('????????'),
            'status' => SubscriptionStatus::Created,
            'current_term_start' => null,
            'current_term_end' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => SubscriptionStatus::Active,
            'current_term_start' => now()->subDay(),
            'current_term_end' => now()->addMonth(),
        ]);
    }

    public function halted(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => SubscriptionStatus::Halted,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => SubscriptionStatus::Cancelled,
        ]);
    }
}
