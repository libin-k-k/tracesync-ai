<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Role Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your module.
|
*/

Route::prefix('role')->group(function (): void {
    // Route::get('/', [\Modules\Role\Controllers\RoleController::class, 'index'])->name('role.index');
});
