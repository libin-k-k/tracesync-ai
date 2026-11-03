<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\User\Controllers\UserController;
use Modules\User\Middleware\SetAuthorizationTenant;

Route::prefix('api/v1')
    ->middleware(['api', 'auth:sanctum', SetAuthorizationTenant::class])
    ->group(function (): void {
        Route::get('users', [UserController::class, 'index'])
            ->name('api.v1.users.index');
        Route::post('users', [UserController::class, 'store'])
            ->name('api.v1.users.store');
        Route::patch('users/{user}/role', [UserController::class, 'assignRole'])
            ->name('api.v1.users.role');
        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->name('api.v1.users.destroy');
        Route::put('project-assignments', [UserController::class, 'assignProject'])
            ->name('api.v1.project-assignments.update');
    });
