<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Project\Controllers\ProjectController;
use Modules\User\Middleware\SetAuthorizationTenant;

/*
|--------------------------------------------------------------------------
| Project API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('api/v1')
    ->middleware(['api', 'auth:sanctum', SetAuthorizationTenant::class])
    ->group(function (): void {
        Route::get('projects', [ProjectController::class, 'index'])
            ->name('api.v1.projects.index');
        Route::post('projects', [ProjectController::class, 'store'])
            ->name('api.v1.projects.store');
        Route::get('projects/{project}', [ProjectController::class, 'show'])
            ->name('api.v1.projects.show');
        Route::put('projects/{project}', [ProjectController::class, 'update'])
            ->name('api.v1.projects.update');
        Route::patch('projects/{project}', [ProjectController::class, 'update'])
            ->name('api.v1.projects.patch');
        Route::patch('projects/{project}/toggle-active', [ProjectController::class, 'toggleActive'])
            ->name('api.v1.projects.toggle-active');
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])
            ->name('api.v1.projects.destroy');
    });
