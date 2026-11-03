<?php

declare(strict_types=1);

namespace Modules\User\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Libinkk\Permission\Conditions\Condition;
use Libinkk\Permission\Conditions\ConditionRegistry;
use Libinkk\Permission\Permissions\Permission;
use Libinkk\Permission\Roles\Role;
use Modules\Tenant\Models\Tenant;
use Modules\User\Models\Team;
use Modules\User\Support\ProjectGrant;
use Modules\User\Support\RoleChange;

class AccessCatalog
{
    /**
     * Higher rank can assign that role and every role below it.
     *
     * @var array<string, int>
     */
    public const RANKS = [
        'Junior Developer' => 1,
        'Senior Developer' => 2,
        'Team Leader' => 3,
        'Engineering Manager' => 4,
        'Admin' => 5,
    ];

    /**
     * Roles each person is allowed to add. This is stricter than rank.
     *
     * @var array<string, list<string>>
     */
    public const CREATES = [
        'Admin' => ['Engineering Manager', 'Team Leader', 'Senior Developer', 'Junior Developer'],
        'Engineering Manager' => ['Team Leader'],
        'Team Leader' => ['Senior Developer', 'Junior Developer'],
    ];

    /**
     * @var array<string, string>
     */
    public const DESCRIPTIONS = [
        'Junior Developer' => 'Reads projects and error history for work assigned to them or their team.',
        'Senior Developer' => 'Inherits Junior Developer. Can update projects assigned to them.',
        'Team Leader' => 'Inherits Senior Developer. Adds senior and junior developers to their team and assigns projects.',
        'Engineering Manager' => 'Inherits Team Leader. Adds team leaders and the teams they lead.',
        'Admin' => 'Workspace owner. Can add engineering managers and manage every team.',
    ];

    public static function registerConditions(): void
    {
        Condition::define('same_tenant', function (object $actor, mixed $resource): bool {
            $member = self::memberFrom($resource);

            if (! $member instanceof User) {
                return true;
            }

            if ($actor instanceof User && $actor->isSuperAdmin()) {
                return true;
            }

            if (! $actor instanceof User || $actor->tenant_id === null || $member->tenant_id === null) {
                return false;
            }

            return (int) $actor->tenant_id === (int) $member->tenant_id;
        });

        Condition::define('not_self', function (object $actor, mixed $resource): bool {
            $member = self::memberFrom($resource);

            if (! $member instanceof User || ! $actor instanceof User) {
                return true;
            }

            if ($member->id === null) {
                return true;
            }

            return (int) $actor->id !== (int) $member->id;
        });

        Condition::define('keeps_an_admin', function (object $actor, mixed $resource): bool {
            $member = self::memberFrom($resource);

            if (! $member instanceof User || $member->tenant_id === null || $member->id === null) {
                return true;
            }

            $tenant = $member->relationLoaded('tenant') ? $member->tenant : Tenant::query()->find($member->tenant_id);

            if (! $tenant instanceof Tenant) {
                return false;
            }

            $current = self::roleFor($member, $tenant);

            if ($current !== 'Admin') {
                return true;
            }

            $nextRole = $resource instanceof RoleChange ? $resource->role : null;

            if ($nextRole === 'Admin') {
                return true;
            }

            return self::adminCount($tenant) > 1;
        });

        Condition::define('allowed_report_role', function (object $actor, mixed $resource): bool {
            if (! $resource instanceof RoleChange || ! $actor instanceof User) {
                return true;
            }

            $tenant = $actor->relationLoaded('tenant') ? $actor->tenant : null;

            if (! $tenant instanceof Tenant && $actor->tenant_id !== null) {
                $tenant = Tenant::query()->find($actor->tenant_id);
            }

            if (! $tenant instanceof Tenant) {
                return false;
            }

            $actorRole = self::roleFor($actor, $tenant);

            if (in_array($resource->role, self::CREATES[$actorRole] ?? [], true)) {
                return true;
            }

            // Admins may assign custom (non-system catalog) roles created via Role module.
            if ($actorRole !== 'Admin' || isset(self::RANKS[$resource->role])) {
                return false;
            }

            return Role::query()
                ->where(fn ($query) => $query->where('name', $resource->role)->orWhere('slug', $resource->role))
                ->where('is_active', true)
                ->exists();
        });

        Condition::define('manages_target', function (object $actor, mixed $resource): bool {
            if (! $resource instanceof ProjectGrant || ! $actor instanceof User) {
                return true;
            }

            return self::managesGrant($actor, $resource);
        });

        $registry = app(ConditionRegistry::class);
        $registry->attach('users.update', 'same_tenant');
        $registry->attach('users.delete', 'same_tenant');
        $registry->attach('users.delete', 'not_self');
        $registry->attach('users.delete', 'keeps_an_admin');
        $registry->attach('users.assign', 'same_tenant');
        $registry->attach('users.assign', 'allowed_report_role');
        $registry->attach('users.assign', 'keeps_an_admin');
        $registry->attach('projects.assign', 'manages_target');
    }

    public static function sync(): void
    {
        $systemPermissions = [
            'errors.view' => 'Errors',
            'projects.view' => 'Projects',
            'projects.create' => 'Projects',
            'projects.update' => 'Projects',
            'projects.delete' => 'Projects',
            'projects.assign' => 'Projects',
            'users.view' => 'Members',
            'users.create' => 'Members',
            'users.update' => 'Members',
            'users.delete' => 'Members',
            'users.assign' => 'Members',
            'settings.manage' => 'Settings',
            'roles.view' => 'Access',
            'roles.manage' => 'Access',
            'permissions.view' => 'Access',
            'permissions.manage' => 'Access',
        ];

        foreach ($systemPermissions as $name => $group) {
            $permission = Permission::define($name, ['group' => $group])->permission();

            if (! $permission->is_system) {
                $permission->forceFill(['is_system' => true])->save();
            }
        }

        $junior = Role::findOrCreate('Junior Developer');
        $senior = Role::findOrCreate('Senior Developer');
        $leader = Role::findOrCreate('Team Leader');
        $manager = Role::findOrCreate('Engineering Manager');
        $admin = Role::findOrCreate('Admin');

        foreach ([$junior, $senior, $leader, $manager, $admin] as $index => $role) {
            $role->forceFill([
                'is_system' => true,
                'is_active' => true,
                'priority' => $index + 1,
                'description' => self::DESCRIPTIONS[$role->name] ?? $role->description,
            ])->save();
        }

        $junior->givePermissionTo('errors.view', 'projects.view');
        $senior->givePermissionTo('projects.update');
        $leader->givePermissionTo('users.view', 'users.create', 'users.assign', 'projects.assign');
        $manager->givePermissionTo('projects.create');
        $admin->givePermissionTo(
            'users.update',
            'users.delete',
            'projects.delete',
            'settings.manage',
            'roles.view',
            'roles.manage',
            'permissions.view',
            'permissions.manage',
        );

        Role::inherit('Senior Developer', 'Junior Developer');
        Role::inherit('Team Leader', 'Senior Developer');
        Role::inherit('Engineering Manager', 'Team Leader');
        Role::inherit('Admin', 'Engineering Manager');
    }

    public static function grant(User $user, string $role, Tenant $tenant): void
    {
        self::sync();

        if (! isset(self::RANKS[$role])) {
            return;
        }

        $user->syncRoles($role, $tenant);
    }

    public static function roleFor(User $user, Tenant $tenant): ?string
    {
        $names = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_type', $user->getMorphClass())
            ->where('user_roles.user_id', $user->getKey())
            ->where('user_roles.scope_type', $tenant->getMorphClass())
            ->where('user_roles.scope_id', (string) $tenant->getKey())
            ->pluck('roles.name');

        $best = null;
        $bestRank = -1;

        foreach ($names as $name) {
            $rank = self::RANKS[(string) $name] ?? 0;

            if ($rank > $bestRank) {
                $best = (string) $name;
                $bestRank = $rank;
            } elseif ($best === null) {
                $best = (string) $name;
                $bestRank = 0;
            }
        }

        return $best;
    }

    public static function adminCount(Tenant $tenant): int
    {
        $adminId = Role::findOrCreate('Admin')->getKey();

        return (int) DB::table('user_roles')
            ->where('role_id', $adminId)
            ->where('scope_type', $tenant->getMorphClass())
            ->where('scope_id', (string) $tenant->getKey())
            ->count();
    }

    public static function managesGrant(User $actor, ProjectGrant $grant): bool
    {
        if ($actor->tenant_id === null) {
            return false;
        }

        if ((int) $grant->project->tenant_id !== (int) $actor->tenant_id) {
            return false;
        }

        $tenant = $actor->relationLoaded('tenant') && $actor->tenant instanceof Tenant
            ? $actor->tenant
            : Tenant::query()->find($actor->tenant_id);

        if (! $tenant instanceof Tenant) {
            return false;
        }

        $role = self::roleFor($actor, $tenant);

        if ($grant->team instanceof Team) {
            if ((int) $grant->team->tenant_id !== (int) $tenant->id) {
                return false;
            }

            return match ($role) {
                'Admin' => true,
                'Engineering Manager' => (int) $grant->team->manager_id === (int) $actor->id,
                'Team Leader' => (int) $grant->team->leader_id === (int) $actor->id,
                default => false,
            };
        }

        $developer = $grant->developer;

        if (! $developer instanceof User || (int) $developer->tenant_id !== (int) $tenant->id) {
            return false;
        }

        $developerRole = self::roleFor($developer, $tenant);

        if (! in_array($developerRole, ['Senior Developer', 'Junior Developer'], true)) {
            return false;
        }

        return match ($role) {
            'Admin' => true,
            'Team Leader' => (int) $developer->manager_id === (int) $actor->id,
            'Engineering Manager' => Team::query()
                ->where('tenant_id', $tenant->id)
                ->where('leader_id', $developer->manager_id)
                ->where('manager_id', $actor->id)
                ->exists(),
            default => false,
        };
    }

    /**
     * @return list<array{name: string, rank: int, description: string, is_system: bool}>
     */
    public static function directory(): array
    {
        self::sync();

        $roles = [];

        foreach (self::RANKS as $name => $rank) {
            $roles[] = [
                'name' => $name,
                'rank' => $rank,
                'description' => self::DESCRIPTIONS[$name],
                'is_system' => true,
            ];
        }

        Role::query()
            ->where('is_system', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['name', 'description'])
            ->each(function (Role $role) use (&$roles): void {
                $roles[] = [
                    'name' => $role->name,
                    'rank' => 0,
                    'description' => (string) ($role->description ?? ''),
                    'is_system' => false,
                ];
            });

        return $roles;
    }

    /**
     * @return list<array{name: string, rank: int, description: string, is_system: bool}>
     */
    public static function creatableFor(User $actor, Tenant $tenant): array
    {
        $role = self::roleFor($actor, $tenant);
        $allowed = self::CREATES[$role] ?? [];
        $roles = [];

        foreach ($allowed as $name) {
            $roles[] = [
                'name' => $name,
                'rank' => self::RANKS[$name],
                'description' => self::DESCRIPTIONS[$name],
                'is_system' => true,
            ];
        }

        if ($role === 'Admin') {
            Role::query()
                ->where('is_system', false)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['name', 'description'])
                ->each(function (Role $custom) use (&$roles): void {
                    $roles[] = [
                        'name' => $custom->name,
                        'rank' => 0,
                        'description' => (string) ($custom->description ?? ''),
                        'is_system' => false,
                    ];
                });
        }

        return $roles;
    }

    private static function memberFrom(mixed $resource): ?User
    {
        if ($resource instanceof RoleChange) {
            return $resource->member;
        }

        return $resource instanceof User ? $resource : null;
    }
}
