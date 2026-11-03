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
use Modules\Role\Requests\StoreRoleRequest;
use Modules\Role\Requests\SyncRolePermissionsRequest;
use Modules\Role\Requests\UpdateRoleRequest;
use Modules\Role\Services\RoleAdminService;
use Throwable;

class RoleController extends Controller
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

            return Api::success($this->roles->listRoles($actor), 'Roles fetched successfully');
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to fetch roles.', 500, [], [], 'ROLE_INDEX_FAILED');
        }
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::created(
                $this->roles->createRole($actor, $request->roleData()),
                'Role created successfully'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to create role.', 500, [], [], 'ROLE_CREATE_FAILED');
        }
    }

    public function show(Request $request, int $role): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::success($this->roles->showRole($actor, $role), 'Role fetched successfully');
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to fetch role.', 500, [], [], 'ROLE_SHOW_FAILED');
        }
    }

    public function update(UpdateRoleRequest $request, int $role): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->roles->updateRole($actor, $role, $request->roleData()),
                'Role updated successfully'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to update role.', 500, [], [], 'ROLE_UPDATE_FAILED');
        }
    }

    public function destroy(Request $request, int $role): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();
            $this->roles->deleteRole($actor, $role);

            return Api::deleted('Role deleted successfully');
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to delete role.', 500, [], [], 'ROLE_DELETE_FAILED');
        }
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, int $role): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->roles->syncRolePermissions($actor, $role, $request->permissionNames()),
                'Role permissions synced'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to sync role permissions.', 500, [], [], 'ROLE_SYNC_FAILED');
        }
    }

    public function attachPermissions(SyncRolePermissionsRequest $request, int $role): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->roles->attachRolePermissions($actor, $role, $request->permissionNames()),
                'Permissions attached to role'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to attach permissions.', 500, [], [], 'ROLE_ATTACH_FAILED');
        }
    }

    public function detachPermission(Request $request, int $role, string $permission): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->roles->detachRolePermission($actor, $role, $permission),
                'Permission detached from role'
            );
        } catch (RoleAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Role not found.', 404, [], [], 'ROLE_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error('Unable to detach permission.', 500, [], [], 'ROLE_DETACH_FAILED');
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
