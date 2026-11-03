<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Tenant\Enums\SubscriptionPlan;
use Modules\Tenant\Models\Tenant;
use Modules\User\Services\AccessCatalog;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenant = Tenant::query()->updateOrCreate(
            ['name' => 'TraceSync Demo'],
            [
                'subscription_plan' => SubscriptionPlan::Free,
            ],
        );

        $user = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'Password1',
                'tenant_id' => $tenant->id,
            ],
        );

        AccessCatalog::grant($user, 'Admin', $tenant);
        $user->assignRole('Admin');
    }
}
