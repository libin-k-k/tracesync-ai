<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Billing\Controllers\BillingController;

/*
|--------------------------------------------------------------------------
| Billing API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/v1')
    ->middleware(['api'])
    ->group(function (): void {
        Route::post('billing/webhook', [BillingController::class, 'webhook'])
            ->name('api.v1.billing.webhook');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('billing/subscribe', [BillingController::class, 'subscribe'])
                ->name('api.v1.billing.subscribe');
        });
    });
