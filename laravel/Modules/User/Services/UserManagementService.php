<?php

declare(strict_types=1);

namespace Modules\User\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Project\Models\Project;
use Modules\Tenant\Models\Tenant;
use Modules\User\Exceptions\MemberAccessException;
use Modules\User\Models\ProjectAssignment;
use Modules\User\Models\Team;
use Modules\User\Support\ProjectGrant;
use Modules\User\Support\RoleChange;

class UserManagementService
{
    /**
     * @return array{
     *     members: list<array<string, mixed>>,
     *     roles: list<array{name: string, rank: int, description: string}>,
     *     creatable_roles: list<array{name: string, rank: int, description: string}>,
     *     teams: list<array<string, mixed>>,
     *     projects: list<array{id: int, name: string}>,
     *     abilities: array{create: bool, assign_project: bool}
     * }
     */
    public function directory(User $actor): array
    {
        $tenant = $this->tenantFor($actor);
        $this->denyUnless($actor, 'users.view');

        $members = User::query()
            ->where('tenant_id', $tenant->id)
            ->with('manager:id,name')
            ->orderBy('name')
            ->limit(100)
            ->get();

        $presented = $members
            ->map(fn (User $member): array => $this->present($actor, $member, $tenant))
            ->values()
            ->all();

        return [
            'members' => $presented,
            'roles' => AccessCatalog::directory(),
            'creatable_roles' => AccessCatalog::creatableFor($actor, $tenant),
            'actor_role' => AccessCatalog::roleFor($actor, $tenant),
            'managers' => array_values(array_map(
                fn (array $member): array => ['id' => $member['id'], 'name' => $member['name']],
                array_filter($presented, fn (array $member): bool => $member['role'] === 'Engineering Manager'),
            )),
            'leaders' => array_values(array_map(
                fn (array $member): array => ['id' => $member['id'], 'name' => $member['name']],
                array_filter($presented, fn (array $member): bool => $member['role'] === 'Team Leader'),
            )),
            'teams' => $this->teamsFor($actor, $tenant, $members),
            'projects' => Project::query()
                ->where('tenant_id', $tenant->id)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Project $project): array => [
                    'id' => (int) $project->id,
                    'name' => $project->name,
                ])
                ->all(),
            'abilities' => [
                'create' => $actor->can('users.create'),
                'assign_project' => $actor->can('projects.assign'),
            ],
        ];
    }

    /**
     * @param  array{name: string, email: string, password: string, role: string, team_name?: string|null, manager_id?: int|null}  $data
     * @return array<string, mixed>
     */
    public function create(User $actor, array $data): array
    {
        $tenant = $this->tenantFor($actor);
        $this->denyUnless($actor, 'users.create');

        $draft = new User([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'email' => $data['email'],
        ]);
        $draft->setRelation('tenant', $tenant);

        $this->denyUnless($actor, 'users.assign', new RoleChange($draft, $data['role']));

        $member = DB::transaction(function () use ($actor, $tenant, $data): User {
            $member = User::query()->create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            $member->setRelation('tenant', $tenant);
            $member->assignRole($data['role'], $tenant);
            $this->place($actor, $member, $tenant, $data['role'], $data['team_name'] ?? null, $data['manager_id'] ?? null);

            return $member->load('manager:id,name');
        });

        return $this->present($actor, $member, $tenant);
    }

    /**
     * @param  array{project_id: int, team_id?: int|null, user_id?: int|null}  $data
     * @return array<string, mixed>
     */
    public function assignProject(User $actor, array $data): array
    {
        $tenant = $this->tenantFor($actor);
        $teamId = $data['team_id'] ?? null;
        $userId = $data['user_id'] ?? null;

        if (($teamId === null) === ($userId === null)) {
            throw new MemberAccessException(
                'Assign the project to a team or to one developer.',
                422,
                'ASSIGNMENT_TARGET_REQUIRED'
            );
        }

        $project = Project::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($data['project_id'])
            ->first();

        if (! $project instanceof Project) {
            throw new ModelNotFoundException('Project not found.');
        }

        $team = null;
        $developer = null;

        if ($teamId !== null) {
            $team = Team::query()->where('tenant_id', $tenant->id)->whereKey($teamId)->first();

            if (! $team instanceof Team) {
                throw new ModelNotFoundException('Team not found.');
            }
        }

        if ($userId !== null) {
            $developer = $this->findMember($tenant, $userId);
        }

        $actor->setRelation('tenant', $tenant);
        $this->denyUnless($actor, 'projects.assign', new ProjectGrant($project, $team, $developer));

        $assignment = ProjectAssignment::query()->updateOrCreate(
            ['project_id' => $project->id],
            [
                'tenant_id' => $tenant->id,
                'team_id' => $team?->id,
                'user_id' => $developer?->id,
                'assigned_by' => $actor->id,
            ],
        );

        return [
            'project_id' => (int) $project->id,
            'project_name' => $project->name,
            'team_id' => $assignment->team_id,
            'user_id' => $assignment->user_id,
        ];
    }

    /**
     * @param  array{role: string}  $data
     * @return array<string, mixed>
     */
    public function assignRole(User $actor, int $memberId, array $data): array
    {
        $tenant = $this->tenantFor($actor);
        $member = $this->findMember($tenant, $memberId);
        $member->setRelation('tenant', $tenant);

        $this->denyUnless($actor, 'users.assign', new RoleChange($member, $data['role']));
        $member->syncRoles($data['role'], $tenant);

        return $this->present($actor, $member->fresh() ?? $member, $tenant);
    }

    public function delete(User $actor, int $memberId): void
    {
        $tenant = $this->tenantFor($actor);
        $member = $this->findMember($tenant, $memberId);
        $member->setRelation('tenant', $tenant);

        $this->denyUnless($actor, 'users.delete', $member);

        DB::table('user_roles')
            ->where('user_type', $member->getMorphClass())
            ->where('user_id', $member->getKey())
            ->delete();
        $member->tokens()->delete();
        $member->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $actor, User $member, Tenant $tenant): array
    {
        $role = AccessCatalog::roleFor($member, $tenant);
        $assignable = [];
        $candidates = collect(array_keys(AccessCatalog::RANKS))
            ->merge(
                collect(AccessCatalog::directory())
                    ->where('is_system', false)
                    ->pluck('name')
            )
            ->unique()
            ->values();

        foreach ($candidates as $candidate) {
            $decision = $actor->explain('users.assign', new RoleChange($member, (string) $candidate));

            if ($decision['allowed'] === true) {
                $assignable[] = (string) $candidate;
            }
        }

        return [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'role' => $role,
            'reports_to' => $member->manager?->name,
            'is_self' => (int) $actor->id === (int) $member->id,
            'can_delete' => $actor->can('users.delete', $member),
            'assignable_roles' => $assignable,
        ];
    }

    private function tenantFor(User $actor): Tenant
    {
        if ($actor->tenant_id === null) {
            throw new MemberAccessException(
                'Member management belongs to a workspace account.',
                403,
                'MEMBER_TENANT_REQUIRED'
            );
        }

        $tenant = $actor->relationLoaded('tenant') ? $actor->tenant : $actor->tenant()->first();

        if (! $tenant instanceof Tenant) {
            throw new MemberAccessException(
                'Workspace not found for this account.',
                404,
                'MEMBER_TENANT_NOT_FOUND'
            );
        }

        return $tenant;
    }

    private function findMember(Tenant $tenant, int $memberId): User
    {
        $member = User::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($memberId)
            ->first();

        if (! $member instanceof User) {
            throw new ModelNotFoundException('Member not found.');
        }

        return $member;
    }

    private function place(User $actor, User $member, Tenant $tenant, string $role, ?string $teamName, ?int $managerId): void
    {
        if ($role === 'Engineering Manager') {
            $member->forceFill(['manager_id' => null])->save();

            return;
        }

        if ($role === 'Team Leader') {
            $manager = $this->resolveReport($actor, $tenant, 'Engineering Manager', $managerId);
            $name = trim((string) $teamName);

            if ($name === '') {
                throw new MemberAccessException('A team name is required for a team leader.', 422, 'TEAM_NAME_REQUIRED');
            }

            $member->forceFill(['manager_id' => $manager->id])->save();
            Team::query()->updateOrCreate(
                ['leader_id' => $member->id],
                [
                    'tenant_id' => $tenant->id,
                    'name' => $name,
                    'manager_id' => $manager->id,
                ],
            );

            return;
        }

        if (! in_array($role, ['Senior Developer', 'Junior Developer'], true)) {
            return;
        }

        $leader = $this->resolveReport($actor, $tenant, 'Team Leader', $managerId);
        $team = Team::query()->where('tenant_id', $tenant->id)->where('leader_id', $leader->id)->first();

        if (! $team instanceof Team) {
            throw new MemberAccessException('That team leader does not have a team yet.', 422, 'TEAM_REQUIRED');
        }

        $member->forceFill(['manager_id' => $leader->id])->save();
    }

    private function resolveReport(User $actor, Tenant $tenant, string $expectedRole, ?int $managerId): User
    {
        $actorRole = AccessCatalog::roleFor($actor, $tenant);

        if ($actorRole === $expectedRole) {
            return $actor;
        }

        if ($managerId === null) {
            throw new MemberAccessException(
                'Choose the '.$expectedRole.' this person reports to.',
                422,
                'MANAGER_REQUIRED'
            );
        }

        $manager = $this->findMember($tenant, $managerId);

        if (AccessCatalog::roleFor($manager, $tenant) !== $expectedRole) {
            throw new MemberAccessException(
                'That person is not a '.$expectedRole.'.',
                422,
                'MANAGER_ROLE_MISMATCH'
            );
        }

        return $manager;
    }

    /**
     * @param  Collection<int, User>  $members
     * @return list<array<string, mixed>>
     */
    private function teamsFor(User $actor, Tenant $tenant, $members): array
    {
        $assignments = ProjectAssignment::query()
            ->where('tenant_id', $tenant->id)
            ->with('project:id,name')
            ->get();

        return Team::query()
            ->where('tenant_id', $tenant->id)
            ->with(['leader:id,name', 'manager:id,name'])
            ->orderBy('name')
            ->get()
            ->map(function (Team $team) use ($actor, $tenant, $members, $assignments): array {
                $developers = $members
                    ->filter(fn (User $member): bool => (int) $member->manager_id === (int) $team->leader_id)
                    ->map(fn (User $member): array => [
                        'id' => (int) $member->id,
                        'name' => $member->name,
                        'role' => AccessCatalog::roleFor($member, $tenant),
                    ])
                    ->values()
                    ->all();

                $projects = $assignments
                    ->filter(function (ProjectAssignment $assignment) use ($team, $developers): bool {
                        if ((int) $assignment->team_id === (int) $team->id) {
                            return true;
                        }

                        $developerIds = array_column($developers, 'id');

                        return $assignment->user_id !== null && in_array((int) $assignment->user_id, $developerIds, true);
                    })
                    ->map(fn (ProjectAssignment $assignment): array => [
                        'project_id' => (int) $assignment->project_id,
                        'project_name' => $assignment->project?->name ?? 'Project',
                        'scope' => $assignment->team_id !== null ? 'team' : 'developer',
                        'user_id' => $assignment->user_id,
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => (int) $team->id,
                    'name' => $team->name,
                    'leader' => [
                        'id' => (int) $team->leader_id,
                        'name' => $team->leader?->name ?? 'Team leader',
                    ],
                    'manager' => $team->manager_id === null ? null : [
                        'id' => (int) $team->manager_id,
                        'name' => $team->manager?->name ?? 'Engineering manager',
                    ],
                    'developers' => $developers,
                    'projects' => $projects,
                    'can_assign' => $actor->can('projects.assign', new ProjectGrant(
                        new Project(['tenant_id' => $tenant->id]),
                        $team,
                    )),
                ];
            })
            ->all();
    }

    private function denyUnless(User $actor, string $permission, mixed $resource = null): void
    {
        $decision = $actor->explain($permission, $resource);

        if ($decision['allowed'] === true) {
            return;
        }

        $conditions = is_array($decision['conditions'] ?? null) ? $decision['conditions'] : [];

        $message = match (true) {
            ($conditions['not_self'] ?? true) === false => 'You cannot remove your own account.',
            ($conditions['keeps_an_admin'] ?? true) === false => 'This workspace must keep at least one Admin.',
            ($conditions['allowed_report_role'] ?? true) === false => 'You can only add the roles that report to you.',
            ($conditions['manages_target'] ?? true) === false => 'You can only assign projects to your own teams or developers.',
            ($conditions['same_tenant'] ?? true) === false => 'That member is outside this workspace.',
            default => 'You do not have permission to manage members.',
        };

        throw new MemberAccessException($message, 403, 'MEMBER_FORBIDDEN');
    }
}
