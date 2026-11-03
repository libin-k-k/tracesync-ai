<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Role\Controllers\AccessController;
use Modules\Role\Controllers\PermissionController;
use Modules\Role\Controllers\RoleController;
use Modules\User\Middleware\SetAuthorizationTenant;

Route::prefix('api/v1')
    ->middleware(['api', 'auth:sanctum', SetAuthorizationTenant::class])
    ->group(function (): void {
        Route::get('access/me', [AccessController::class, 'me'])
            ->name('api.v1.access.me');

        Route::get('roles', [RoleController::class, 'index'])
            ->name('api.v1.roles.index');
        Route::post('roles', [RoleController::class, 'store'])
            ->name('api.v1.roles.store');
        Route::get('roles/{role}', [RoleController::class, 'show'])
            ->whereNumber('role')
            ->name('api.v1.roles.show');
        Route::put('roles/{role}', [RoleController::class, 'update'])
            ->whereNumber('role')
            ->name('api.v1.roles.update');
        Route::patch('roles/{role}', [RoleController::class, 'update'])
            ->whereNumber('role')
            ->name('api.v1.roles.patch');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])
            ->whereNumber('role')
            ->name('api.v1.roles.destroy');
        Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])
            ->whereNumber('role')
            ->name('api.v1.roles.permissions.sync');
        Route::post('roles/{role}/permissions', [RoleController::class, 'attachPermissions'])
            ->whereNumber('role')
            ->name('api.v1.roles.permissions.attach');
        Route::delete('roles/{role}/permissions/{permission}', [RoleController::class, 'detachPermission'])
            ->whereNumber('role')
            ->name('api.v1.roles.permissions.detach');

        Route::get('permissions', [PermissionController::class, 'index'])
            ->name('api.v1.permissions.index');
        Route::post('permissions', [PermissionController::class, 'store'])
            ->name('api.v1.permissions.store');
        Route::get('permissions/{permission}', [PermissionController::class, 'show'])
            ->whereNumber('permission')
            ->name('api.v1.permissions.show');
        Route::put('permissions/{permission}', [PermissionController::class, 'update'])
            ->whereNumber('permission')
            ->name('api.v1.permissions.update');
        Route::patch('permissions/{permission}', [PermissionController::class, 'update'])
            ->whereNumber('permission')
            ->name('api.v1.permissions.patch');
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])
            ->whereNumber('permission')
            ->name('api.v1.permissions.destroy');
    });
