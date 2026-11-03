<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Project Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your module.
|
*/

Route::prefix('project')->group(function (): void {
    // Route::get('/', [\Modules\Project\Controllers\ProjectController::class, 'index'])->name('project.index');
});
