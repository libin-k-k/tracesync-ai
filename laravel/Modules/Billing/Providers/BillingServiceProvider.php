<?php

declare(strict_types=1);

namespace Modules\Billing\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Billing\Services\RazorpayService;

class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RazorpayService::class, function (): RazorpayService {
            return new RazorpayService;
        });
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');

        if (file_exists(__DIR__.'/../Routes/api.php')) {
            $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        }

        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadViewsFrom(__DIR__.'/../Views', 'billing');
        $this->loadTranslationsFrom(__DIR__.'/../Lang', 'billing');

        $configPath = __DIR__.'/../Config';
        if (is_dir($configPath)) {
            foreach (glob($configPath.'/*.php') ?: [] as $configFile) {
                $this->mergeConfigFrom($configFile, 'billing.'.basename($configFile, '.php'));
            }
        }
    }
}
