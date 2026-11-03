<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::prefix('users')->group(function (): void {
    // Member management is exposed on the API routes.
});
