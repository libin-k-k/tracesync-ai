<?php

declare(strict_types=1);

namespace Modules\Auth\Providers;

use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/web.php');

        if (file_exists(__DIR__ . '/../Routes/api.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
        }

        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadViewsFrom(__DIR__ . '/../Views', 'auth');
        $this->loadTranslationsFrom(__DIR__ . '/../Lang', 'auth');

        $configPath = __DIR__ . '/../Config';
        if (is_dir($configPath)) {
            foreach (glob($configPath . '/*.php') ?: [] as $configFile) {
                $this->mergeConfigFrom($configFile, 'auth.' . basename($configFile, '.php'));
            }
        }
    }
}
