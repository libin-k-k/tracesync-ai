<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Project\Models\Project;
use Modules\Tenant\Models\Tenant;
use Modules\User\Models\Team;
use Modules\User\Services\AccessCatalog;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Tenant}
     */
    private function member(string $role): array
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($user, $role, $tenant);
        Sanctum::actingAs($user);

        return [$user, $tenant];
    }

    #[Test]
    public function a_viewer_cannot_list_members(): void
    {
        $this->member('Junior Developer');

        $this->getJson('/api/v1/users', ['X-API-Version' => 'v1'])
            ->assertForbidden()
            ->assertJsonPath('error_code', 'MEMBER_FORBIDDEN');
    }

    #[Test]
    public function an_admin_can_invite_a_developer(): void
    {
        [$admin, $tenant] = $this->member('Admin');

        $response = $this->postJson('/api/v1/users', [
            'name' => 'Asha Dev',
            'email' => 'asha@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Engineering Manager',
        ], ['X-API-Version' => 'v1']);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'asha@example.com')
            ->assertJsonPath('data.role', 'Engineering Manager');

        $created = User::query()->where('email', 'asha@example.com')->first();
        $this->assertNotNull($created);
        $this->assertSame($tenant->id, $created->tenant_id);
        $this->assertNotSame($admin->id, $created->id);
        $this->assertSame('Engineering Manager', AccessCatalog::roleFor($created, $tenant));
    }

    #[Test]
    public function an_admin_cannot_remove_themselves(): void
    {
        [$admin] = $this->member('Admin');

        $this->deleteJson('/api/v1/users/'.$admin->id, [], ['X-API-Version' => 'v1'])
            ->assertForbidden()
            ->assertJsonPath('message', 'You cannot remove your own account.');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    #[Test]
    public function the_last_admin_cannot_be_demoted(): void
    {
        [$admin] = $this->member('Admin');

        $this->patchJson('/api/v1/users/'.$admin->id.'/role', [
            'role' => 'Junior Developer',
        ], ['X-API-Version' => 'v1'])
            ->assertForbidden()
            ->assertJsonPath('message', 'This workspace must keep at least one Admin.');
    }

    #[Test]
    public function an_admin_can_remove_another_member(): void
    {
        [$admin, $tenant] = $this->member('Admin');
        $developer = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($developer, 'Junior Developer', $tenant);

        $this->deleteJson('/api/v1/users/'.$developer->id, [], ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('users', ['id' => $developer->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    #[Test]
    public function a_developer_cannot_invite_members(): void
    {
        $this->member('Senior Developer');

        $this->postJson('/api/v1/users', [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Junior Developer',
        ], ['X-API-Version' => 'v1'])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'new@example.com']);
    }

    #[Test]
    public function a_viewer_cannot_create_projects(): void
    {
        $this->member('Junior Developer');

        $this->postJson('/api/v1/projects', [
            'name' => 'Blocked',
            'framework_type' => 'laravel',
        ], ['X-API-Version' => 'v1'])
            ->assertForbidden();
    }

    #[Test]
    public function an_engineering_manager_adds_team_leaders_and_a_leader_adds_developers(): void
    {
        [, $tenant] = $this->member('Admin');

        $managerId = $this->postJson('/api/v1/users', [
            'name' => 'Mina Manager',
            'email' => 'mina@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Engineering Manager',
        ], ['X-API-Version' => 'v1'])->assertCreated()->json('data.id');

        $manager = User::query()->findOrFail($managerId);
        Sanctum::actingAs($manager);

        $leaderResponse = $this->postJson('/api/v1/users', [
            'name' => 'Leo Leader',
            'email' => 'leo@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Team Leader',
            'team_name' => 'Checkout',
        ], ['X-API-Version' => 'v1']);

        $leaderResponse->assertCreated()->assertJsonPath('data.role', 'Team Leader');
        $leader = User::query()->where('email', 'leo@example.com')->firstOrFail();
        $this->assertSame($manager->id, $leader->manager_id);
        $this->assertDatabaseHas('teams', [
            'tenant_id' => $tenant->id,
            'name' => 'Checkout',
            'leader_id' => $leader->id,
            'manager_id' => $manager->id,
        ]);

        $this->postJson('/api/v1/users', [
            'name' => 'Junior Jay',
            'email' => 'jay@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Junior Developer',
        ], ['X-API-Version' => 'v1'])->assertForbidden();

        Sanctum::actingAs($leader);

        $this->postJson('/api/v1/users', [
            'name' => 'Senior Sam',
            'email' => 'sam@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Senior Developer',
        ], ['X-API-Version' => 'v1'])->assertCreated();

        $this->postJson('/api/v1/users', [
            'name' => 'Junior Jay',
            'email' => 'jay@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'Junior Developer',
        ], ['X-API-Version' => 'v1'])->assertCreated();

        $this->assertSame($leader->id, User::query()->where('email', 'sam@example.com')->value('manager_id'));
        $this->assertSame($leader->id, User::query()->where('email', 'jay@example.com')->value('manager_id'));
    }

    #[Test]
    public function a_team_leader_assigns_a_project_to_the_team_or_one_developer(): void
    {
        [, $tenant] = $this->member('Admin');
        $manager = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($manager, 'Engineering Manager', $tenant);
        $leader = User::factory()->forTenant($tenant)->create(['manager_id' => $manager->id]);
        AccessCatalog::grant($leader, 'Team Leader', $tenant);
        $team = Team::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Ingest',
            'leader_id' => $leader->id,
            'manager_id' => $manager->id,
        ]);
        $junior = User::factory()->forTenant($tenant)->create(['manager_id' => $leader->id]);
        AccessCatalog::grant($junior, 'Junior Developer', $tenant);
        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Ingest API',
        ]);

        Sanctum::actingAs($leader);

        $this->putJson('/api/v1/project-assignments', [
            'project_id' => $project->id,
            'team_id' => $team->id,
        ], ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('data.team_id', $team->id);

        $this->putJson('/api/v1/project-assignments', [
            'project_id' => $project->id,
            'user_id' => $junior->id,
        ], ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('data.user_id', $junior->id)
            ->assertJsonPath('data.team_id', null);

        $otherLeader = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($otherLeader, 'Team Leader', $tenant);
        Sanctum::actingAs($otherLeader);

        $this->putJson('/api/v1/project-assignments', [
            'project_id' => $project->id,
            'user_id' => $junior->id,
        ], ['X-API-Version' => 'v1'])->assertForbidden();
    }
}
