<?php

namespace App\Providers;

use App\OneAuth\SanctumDriver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Libinkk\OneAuth\Drivers\SanctumDriver as OneAuthSanctumDriver;
use Modules\Project\Models\Project;
use Modules\Project\Policies\ProjectPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(OneAuthSanctumDriver::class, SanctumDriver::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // utf8mb4 unique indexes exceed MySQL's 3072-byte limit without this.
        Schema::defaultStringLength(191);

        Gate::policy(Project::class, ProjectPolicy::class);
    }
}
