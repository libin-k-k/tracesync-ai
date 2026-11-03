<?php

declare(strict_types=1);

namespace Tests\Feature\Role;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Libinkk\Permission\Permissions\Permission;
use Libinkk\Permission\Roles\Role;
use Modules\Tenant\Models\Tenant;
use Modules\User\Services\AccessCatalog;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RolePermissionAdminTest extends TestCase
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
    public function a_junior_cannot_list_roles(): void
    {
        $this->member('Junior Developer');

        $this->getJson('/api/v1/roles', ['X-API-Version' => 'v1'])
            ->assertForbidden()
            ->assertJsonPath('error_code', 'ROLE_FORBIDDEN');
    }

    #[Test]
    public function an_admin_can_create_a_custom_role_with_permissions(): void
    {
        $this->member('Admin');
        AccessCatalog::sync();
        Permission::findOrCreate('errors.view');

        $response = $this->postJson('/api/v1/roles', [
            'name' => 'QA Lead',
            'description' => 'Reviews production incidents.',
            'permissions' => ['errors.view', 'projects.view'],
        ], ['X-API-Version' => 'v1']);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'QA Lead')
            ->assertJsonPath('data.is_system', false);

        $this->assertDatabaseHas('roles', [
            'name' => 'QA Lead',
            'is_system' => 0,
        ]);

        $role = Role::query()->where('name', 'QA Lead')->first();
        $this->assertNotNull($role);
        $this->assertTrue($role->hasPermissionTo('errors.view'));
        $this->assertTrue($role->hasPermissionTo('projects.view'));
    }

    #[Test]
    public function an_admin_cannot_delete_a_system_role(): void
    {
        $this->member('Admin');
        AccessCatalog::sync();
        $adminRole = Role::findOrCreate('Admin');

        $this->deleteJson('/api/v1/roles/'.$adminRole->getKey(), [], ['X-API-Version' => 'v1'])
            ->assertStatus(422)
            ->assertJsonPath('error_code', 'ROLE_SYSTEM_LOCKED');
    }

    #[Test]
    public function an_admin_can_create_and_delete_a_custom_permission(): void
    {
        $this->member('Admin');

        $create = $this->postJson('/api/v1/permissions', [
            'name' => 'reports.export',
            'group' => 'Reports',
            'description' => 'Export analytics',
        ], ['X-API-Version' => 'v1']);

        $create->assertCreated()
            ->assertJsonPath('data.name', 'reports.export')
            ->assertJsonPath('data.is_system', false);

        $id = (int) $create->json('data.id');

        $this->deleteJson('/api/v1/permissions/'.$id, [], ['X-API-Version' => 'v1'])
            ->assertOk();

        $this->assertSoftDeleted('permissions', ['id' => $id]);
    }

    #[Test]
    public function an_admin_cannot_delete_a_system_permission(): void
    {
        $this->member('Admin');
        AccessCatalog::sync();
        $permission = Permission::query()->where('name', 'projects.view')->first();
        $this->assertNotNull($permission);

        $this->deleteJson('/api/v1/permissions/'.$permission->getKey(), [], ['X-API-Version' => 'v1'])
            ->assertStatus(422)
            ->assertJsonPath('error_code', 'PERMISSION_SYSTEM_LOCKED');
    }

    #[Test]
    public function an_admin_can_sync_permissions_on_a_custom_role(): void
    {
        $this->member('Admin');
        AccessCatalog::sync();

        $role = Role::query()->create([
            'name' => 'Support',
            'slug' => 'support',
            'is_system' => false,
            'is_active' => true,
        ]);

        $this->putJson('/api/v1/roles/'.$role->getKey().'/permissions', [
            'permissions' => ['errors.view', 'users.view'],
        ], ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Support');

        $role->refresh()->load('permissions');
        $this->assertTrue($role->hasPermissionTo('errors.view'));
        $this->assertTrue($role->hasPermissionTo('users.view'));
        $this->assertFalse($role->hasPermissionTo('projects.delete'));
    }

    #[Test]
    public function an_admin_can_assign_a_custom_role_to_a_member(): void
    {
        [$admin, $tenant] = $this->member('Admin');
        AccessCatalog::sync();

        Role::query()->create([
            'name' => 'Contractor',
            'slug' => 'contractor',
            'is_system' => false,
            'is_active' => true,
        ]);

        $member = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($member, 'Junior Developer', $tenant);

        $this->patchJson('/api/v1/users/'.$member->id.'/role', [
            'role' => 'Contractor',
        ], ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('data.role', 'Contractor');
    }

    #[Test]
    public function access_me_returns_effective_permissions_for_admin(): void
    {
        $this->member('Admin');

        $this->getJson('/api/v1/access/me', ['X-API-Version' => 'v1'])
            ->assertOk()
            ->assertJsonPath('data.role', 'Admin')
            ->assertJsonPath('data.abilities.roles_manage', true)
            ->assertJsonPath('data.abilities.permissions_manage', true);
    }
}
