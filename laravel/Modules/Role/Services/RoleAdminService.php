<?php

declare(strict_types=1);

namespace Modules\Role\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Libinkk\Permission\Exceptions\SystemRecordProtectedException;
use Libinkk\Permission\Permissions\Permission;
use Libinkk\Permission\Roles\Role;
use Modules\Role\Exceptions\RoleAccessException;
use Modules\User\Services\AccessCatalog;

class RoleAdminService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function listRoles(User $actor): array
    {
        $this->denyUnless($actor, 'roles.view');
        AccessCatalog::sync();

        return Role::query()
            ->with('permissions:id,name,slug,group,resource,action,is_system')
            ->orderByDesc('is_system')
            ->orderBy('priority')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => $this->presentRole($role))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function showRole(User $actor, int $roleId): array
    {
        $this->denyUnless($actor, 'roles.view');

        return $this->presentRole($this->findRole($roleId)->load('permissions'));
    }

    /**
     * @param  array{name: string, description?: string|null, permissions?: list<string>}  $data
     * @return array<string, mixed>
     */
    public function createRole(User $actor, array $data): array
    {
        $this->denyUnless($actor, 'roles.manage');
        AccessCatalog::sync();

        $name = trim($data['name']);

        if (isset(AccessCatalog::RANKS[$name])) {
            throw new RoleAccessException(
                'That name is reserved for a built-in TraceSync role.',
                422,
                'ROLE_NAME_RESERVED'
            );
        }

        if ($this->roleExists($name)) {
            throw new RoleAccessException('A role with that name already exists.', 422, 'ROLE_EXISTS');
        }

        $role = DB::transaction(function () use ($data, $name): Role {
            $role = Role::query()->create([
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => $data['description'] ?? null,
                'guard_name' => config('permission.default_guard', 'web'),
                'is_system' => false,
                'is_active' => true,
                'priority' => 0,
            ]);

            if (! empty($data['permissions'])) {
                $role->syncPermissions($data['permissions']);
            }

            return $role->load('permissions');
        });

        return $this->presentRole($role);
    }

    /**
     * @param  array{name?: string, description?: string|null, is_active?: bool}  $data
     * @return array<string, mixed>
     */
    public function updateRole(User $actor, int $roleId, array $data): array
    {
        $this->denyUnless($actor, 'roles.manage');
        $role = $this->findRole($roleId);

        if ($role->is_system && isset($data['name']) && trim((string) $data['name']) !== $role->name) {
            throw new RoleAccessException(
                'Built-in roles cannot be renamed.',
                422,
                'ROLE_SYSTEM_LOCKED'
            );
        }

        if (isset($data['name'])) {
            $name = trim((string) $data['name']);

            if ($name !== $role->name && $this->roleExists($name, $role->getKey())) {
                throw new RoleAccessException('A role with that name already exists.', 422, 'ROLE_EXISTS');
            }

            if (! $role->is_system && isset(AccessCatalog::RANKS[$name])) {
                throw new RoleAccessException(
                    'That name is reserved for a built-in TraceSync role.',
                    422,
                    'ROLE_NAME_RESERVED'
                );
            }

            $role->name = $name;
            $role->slug = Str::slug($name);
        }

        if (array_key_exists('description', $data)) {
            $role->description = $data['description'];
        }

        if (array_key_exists('is_active', $data) && ! $role->is_system) {
            $role->is_active = (bool) $data['is_active'];
        }

        $role->save();

        return $this->presentRole($role->fresh(['permissions']) ?? $role->load('permissions'));
    }

    public function deleteRole(User $actor, int $roleId): void
    {
        $this->denyUnless($actor, 'roles.manage');
        $role = $this->findRole($roleId);

        if ($role->is_system || isset(AccessCatalog::RANKS[$role->name])) {
            throw new RoleAccessException(
                'Built-in roles cannot be deleted.',
                422,
                'ROLE_SYSTEM_LOCKED'
            );
        }

        $assigned = DB::table('user_roles')->where('role_id', $role->getKey())->count();

        if ($assigned > 0) {
            throw new RoleAccessException(
                'Remove this role from all members before deleting it.',
                422,
                'ROLE_IN_USE'
            );
        }

        try {
            $role->delete();
        } catch (SystemRecordProtectedException $exception) {
            throw new RoleAccessException($exception->getMessage(), 422, 'ROLE_SYSTEM_LOCKED');
        }
    }

    /**
     * @param  list<string>  $permissions
     * @return array<string, mixed>
     */
    public function syncRolePermissions(User $actor, int $roleId, array $permissions): array
    {
        $this->denyUnless($actor, 'roles.manage');
        $role = $this->findRole($roleId);
        $this->assertKnownPermissions($permissions);
        $role->syncPermissions($permissions);

        return $this->presentRole($role->fresh(['permissions']) ?? $role->load('permissions'));
    }

    /**
     * @param  list<string>  $permissions
     * @return array<string, mixed>
     */
    public function attachRolePermissions(User $actor, int $roleId, array $permissions): array
    {
        $this->denyUnless($actor, 'roles.manage');
        $role = $this->findRole($roleId);
        $this->assertKnownPermissions($permissions);
        $role->givePermissionTo($permissions);

        return $this->presentRole($role->fresh(['permissions']) ?? $role->load('permissions'));
    }

    /**
     * @return array<string, mixed>
     */
    public function detachRolePermission(User $actor, int $roleId, string $permission): array
    {
        $this->denyUnless($actor, 'roles.manage');
        $role = $this->findRole($roleId);
        $this->assertKnownPermissions([$permission]);
        $role->revokePermissionTo($permission);

        return $this->presentRole($role->fresh(['permissions']) ?? $role->load('permissions'));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listPermissions(User $actor): array
    {
        $this->denyUnless($actor, 'permissions.view');
        AccessCatalog::sync();

        return Permission::query()
            ->orderBy('group')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission): array => $this->presentPermission($permission))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function showPermission(User $actor, int $permissionId): array
    {
        $this->denyUnless($actor, 'permissions.view');

        return $this->presentPermission($this->findPermission($permissionId));
    }

    /**
     * @param  array{name: string, group?: string|null, description?: string|null}  $data
     * @return array<string, mixed>
     */
    public function createPermission(User $actor, array $data): array
    {
        $this->denyUnless($actor, 'permissions.manage');

        $name = Str::lower(trim($data['name']));

        if (! preg_match('/^[a-z0-9_-]+\.[a-z0-9_-]+$/', $name)) {
            throw new RoleAccessException(
                'Permission names must use resource.action (example: reports.export).',
                422,
                'PERMISSION_NAME_INVALID'
            );
        }

        if (Permission::query()->where('name', $name)->orWhere('slug', $name)->exists()) {
            throw new RoleAccessException('That permission already exists.', 422, 'PERMISSION_EXISTS');
        }

        [$resource, $action] = explode('.', $name, 2);

        $permission = Permission::query()->create([
            'name' => $name,
            'slug' => Str::slug($name, '.'),
            'resource' => $resource,
            'action' => $action,
            'group' => $data['group'] ?? Str::headline($resource),
            'description' => $data['description'] ?? null,
            'guard_name' => config('permission.default_guard', 'web'),
            'is_system' => false,
            'is_active' => true,
        ]);

        return $this->presentPermission($permission);
    }

    /**
     * @param  array{group?: string|null, description?: string|null, is_active?: bool}  $data
     * @return array<string, mixed>
     */
    public function updatePermission(User $actor, int $permissionId, array $data): array
    {
        $this->denyUnless($actor, 'permissions.manage');
        $permission = $this->findPermission($permissionId);

        if (array_key_exists('group', $data)) {
            $permission->group = $data['group'];
        }

        if (array_key_exists('description', $data)) {
            $permission->description = $data['description'];
        }

        if (array_key_exists('is_active', $data) && ! $permission->is_system) {
            $permission->is_active = (bool) $data['is_active'];
        }

        $permission->save();

        return $this->presentPermission($permission->fresh() ?? $permission);
    }

    public function deletePermission(User $actor, int $permissionId): void
    {
        $this->denyUnless($actor, 'permissions.manage');
        $permission = $this->findPermission($permissionId);

        if ($permission->is_system) {
            throw new RoleAccessException(
                'Built-in permissions cannot be deleted.',
                422,
                'PERMISSION_SYSTEM_LOCKED'
            );
        }

        $inUse = DB::table('role_permissions')->where('permission_id', $permission->getKey())->count();

        if ($inUse > 0) {
            throw new RoleAccessException(
                'Detach this permission from all roles before deleting it.',
                422,
                'PERMISSION_IN_USE'
            );
        }

        try {
            $permission->delete();
        } catch (SystemRecordProtectedException $exception) {
            throw new RoleAccessException($exception->getMessage(), 422, 'PERMISSION_SYSTEM_LOCKED');
        }
    }

    /**
     * @return array{role: ?string, permissions: list<string>, abilities: array<string, bool>}
     */
    public function me(User $actor): array
    {
        AccessCatalog::sync();
        $actor->loadMissing('tenant');
        $tenant = $actor->tenant;

        $role = $tenant !== null ? AccessCatalog::roleFor($actor, $tenant) : null;
        $permissions = $actor->getPermissionNames()
            ->map(fn (mixed $name): string => (string) $name)
            ->unique()
            ->sort()
            ->values()
            ->all();

        return [
            'role' => $role,
            'permissions' => $permissions,
            'abilities' => [
                'roles_view' => $actor->can('roles.view'),
                'roles_manage' => $actor->can('roles.manage'),
                'permissions_view' => $actor->can('permissions.view'),
                'permissions_manage' => $actor->can('permissions.manage'),
            ],
        ];
    }

    private function findRole(int $roleId): Role
    {
        $role = Role::query()->whereKey($roleId)->first();

        if (! $role instanceof Role) {
            throw (new ModelNotFoundException)->setModel(Role::class, [$roleId]);
        }

        return $role;
    }

    private function findPermission(int $permissionId): Permission
    {
        $permission = Permission::query()->whereKey($permissionId)->first();

        if (! $permission instanceof Permission) {
            throw (new ModelNotFoundException)->setModel(Permission::class, [$permissionId]);
        }

        return $permission;
    }

    private function roleExists(string $name, mixed $ignoreId = null): bool
    {
        $query = Role::query()
            ->where(fn ($builder) => $builder->where('name', $name)->orWhere('slug', Str::slug($name)));

        if ($ignoreId !== null) {
            $query->whereKeyNot($ignoreId);
        }

        return $query->exists();
    }

    /**
     * @param  list<string>  $permissions
     */
    private function assertKnownPermissions(array $permissions): void
    {
        if ($permissions === []) {
            return;
        }

        $found = Permission::query()
            ->whereIn('name', $permissions)
            ->pluck('name')
            ->all();

        $missing = array_values(array_diff($permissions, $found));

        if ($missing !== []) {
            throw new RoleAccessException(
                'Unknown permission: '.implode(', ', $missing),
                422,
                'PERMISSION_UNKNOWN'
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function presentRole(Role $role): array
    {
        $permissions = $role->relationLoaded('permissions')
            ? $role->permissions
            : $role->permissions()->get(['permissions.id', 'permissions.name', 'permissions.slug', 'permissions.group', 'permissions.resource', 'permissions.action', 'permissions.is_system']);

        return [
            'id' => (int) $role->getKey(),
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
            'is_system' => (bool) $role->is_system,
            'is_active' => (bool) $role->is_active,
            'priority' => (int) $role->priority,
            'permissions' => $permissions
                ->map(fn (Permission $permission): array => [
                    'id' => (int) $permission->getKey(),
                    'name' => $permission->name,
                    'group' => $permission->group,
                    'is_system' => (bool) $permission->is_system,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentPermission(Permission $permission): array
    {
        return [
            'id' => (int) $permission->getKey(),
            'name' => $permission->name,
            'slug' => $permission->slug,
            'resource' => $permission->resource,
            'action' => $permission->action,
            'group' => $permission->group,
            'description' => $permission->description,
            'is_system' => (bool) $permission->is_system,
            'is_active' => (bool) $permission->is_active,
        ];
    }

    private function denyUnless(User $actor, string $permission): void
    {
        if ($actor->isSuperAdmin()) {
            return;
        }

        $decision = $actor->explain($permission);

        if (($decision['allowed'] ?? false) === true) {
            return;
        }

        throw new RoleAccessException(
            match ($permission) {
                'roles.view' => 'You do not have permission to view roles.',
                'roles.manage' => 'You do not have permission to manage roles.',
                'permissions.view' => 'You do not have permission to view permissions.',
                'permissions.manage' => 'You do not have permission to manage permissions.',
                default => 'You do not have permission for this action.',
            },
            403,
            'ROLE_FORBIDDEN'
        );
    }
}
