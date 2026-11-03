<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Billing Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your module.
|
*/

Route::prefix('billing')->group(function (): void {
    // Route::get('/', [\Modules\Billing\Controllers\BillingController::class, 'index'])->name('billing.index');
});
