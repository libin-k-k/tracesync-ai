<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tenant Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your module.
|
*/

Route::prefix('tenant')->group(function (): void {
    // Route::get('/', [\Modules\Tenant\Controllers\TenantController::class, 'index'])->name('tenant.index');
});
