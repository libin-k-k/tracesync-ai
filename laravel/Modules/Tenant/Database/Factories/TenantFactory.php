<?php

declare(strict_types=1);

namespace Modules\Tenant\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Tenant\Enums\SubscriptionPlan;
use Modules\Tenant\Models\Tenant;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'subscription_plan' => SubscriptionPlan::Free,
        ];
    }

    public function pro(): static
    {
        return $this->state(fn (array $attributes): array => [
            'subscription_plan' => SubscriptionPlan::Pro,
        ]);
    }

    public function enterprise(): static
    {
        return $this->state(fn (array $attributes): array => [
            'subscription_plan' => SubscriptionPlan::Enterprise,
        ]);
    }
}
