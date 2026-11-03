<?php

declare(strict_types=1);

namespace Modules\Role\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Libinkk\ApiStarter\Facades\Api;
use Modules\Role\Exceptions\RoleAccessException;
use Modules\Role\Requests\StorePermissionRequest;
use Modules\Role\Requests\UpdatePermissionRequest;
use Modules\Role\Services\RoleAdminService;
use Throwable;

class PermissionController extends Controller
{
    public function __construct(
        private readonly RoleAdminService $roles,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::success($this->roles->listPermissions($actor), 'Permissions fetched successfully');
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to fetch permissions.', 500, [], [], 'PERMISSION_INDEX_FAILED');
        }
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::created(
                $this->roles->createPermission($actor, $request->permissionData()),
                'Permission created successfully'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to create permission.', 500, [], [], 'PERMISSION_CREATE_FAILED');
        }
    }

    public function show(Request $request, int $permission): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::success(
                $this->roles->showPermission($actor, $permission),
                'Permission fetched successfully'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Permission not found.', 404, [], [], 'PERMISSION_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to fetch permission.', 500, [], [], 'PERMISSION_SHOW_FAILED');
        }
    }

    public function update(UpdatePermissionRequest $request, int $permission): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->roles->updatePermission($actor, $permission, $request->permissionData()),
                'Permission updated successfully'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Permission not found.', 404, [], [], 'PERMISSION_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to update permission.', 500, [], [], 'PERMISSION_UPDATE_FAILED');
        }
    }

    public function destroy(Request $request, int $permission): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();
            $this->roles->deletePermission($actor, $permission);

            return Api::deleted('Permission deleted successfully');
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Permission not found.', 404, [], [], 'PERMISSION_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to delete permission.', 500, [], [], 'PERMISSION_DELETE_FAILED');
        }
    }

    private function denied(RoleAccessException $exception): JsonResponse
    {
        return Api::error(
            $exception->getMessage(),
            $exception->status,
            [],
            [],
            $exception->errorCode
        );
    }
}
