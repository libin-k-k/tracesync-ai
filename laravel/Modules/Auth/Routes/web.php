<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your module.
|
*/

Route::prefix('auth')->group(function (): void {
    // Route::get('/', [\Modules\Auth\Controllers\AuthController::class, 'index'])->name('auth.index');
});
