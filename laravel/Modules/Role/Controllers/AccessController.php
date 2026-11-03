<?php

declare(strict_types=1);

namespace Modules\Role\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Libinkk\ApiStarter\Facades\Api;
use Modules\Role\Services\RoleAdminService;
use Throwable;

class AccessController extends Controller
{
    public function __construct(
        private readonly RoleAdminService $roles,
    ) {
    }

    public function me(Request $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::success($this->roles->me($actor), 'Access payload fetched');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to fetch access payload.', 500, [], [], 'ACCESS_ME_FAILED');
        }
    }
}
