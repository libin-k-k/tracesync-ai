<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Auth\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| Auth API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/v1')
    ->middleware(['api'])
    ->group(function (): void {
        Route::post('auth/register', [AuthController::class, 'register'])
            ->name('api.v1.auth.register');
        Route::post('auth/login', [AuthController::class, 'login'])
            ->name('api.v1.auth.login');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('auth/me', [AuthController::class, 'me'])
                ->name('api.v1.auth.me');
        });
    });
