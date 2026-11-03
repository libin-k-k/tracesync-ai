<?php

declare(strict_types=1);

namespace Tests\Feature\Project;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Project\Models\Project;
use Modules\Tenant\Models\Tenant;
use Modules\User\Services\AccessCatalog;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Tenant}
     */
    private function actingAsTenantUser(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();
        AccessCatalog::grant($user, 'Admin', $tenant);
        Sanctum::actingAs($user);

        return [$user, $tenant];
    }

    #[Test]
    public function it_requires_authentication_to_access_projects(): void
    {
        $response = $this->getJson('/api/v1/projects', [
            'X-API-Version' => 'v1',
        ]);

        $response->assertUnauthorized();
    }

    #[Test]
    public function it_creates_a_project_under_the_authenticated_users_tenant(): void
    {
        [, $tenant] = $this->actingAsTenantUser(
            Tenant::factory()->create(['name' => 'Acme Observability'])
        );

        $response = $this->postJson('/api/v1/projects', [
            'name' => 'Checkout API',
            'framework_type' => 'laravel',
            'is_active' => true,
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('message', 'Project created successfully')
            ->assertJsonPath('data.name', 'Checkout API')
            ->assertJsonPath('data.framework_type', 'laravel')
            ->assertJsonPath('data.tenant_id', $tenant->id)
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('projects', [
            'tenant_id' => $tenant->id,
            'name' => 'Checkout API',
            'framework_type' => 'laravel',
            'is_active' => 1,
        ]);
    }

    #[Test]
    public function it_ignores_client_tenant_id_and_uses_authenticated_tenant(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $otherTenant = Tenant::factory()->create();

        $response = $this->postJson('/api/v1/projects', [
            'tenant_id' => $otherTenant->id,
            'name' => 'Forced Scope Project',
            'framework_type' => 'nestjs',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tenant_id', $tenant->id);

        $this->assertDatabaseHas('projects', [
            'name' => 'Forced Scope Project',
            'tenant_id' => $tenant->id,
        ]);
        $this->assertDatabaseMissing('projects', [
            'name' => 'Forced Scope Project',
            'tenant_id' => $otherTenant->id,
        ]);
    }

    #[Test]
    public function it_requires_name_and_framework_type(): void
    {
        $this->actingAsTenantUser();

        $response = $this->postJson('/api/v1/projects', [], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['name', 'framework_type'], 'errors');
    }

    #[Test]
    public function it_lists_only_projects_for_the_authenticated_tenant(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $otherTenant = Tenant::factory()->create();

        Project::factory()->count(2)->create(['tenant_id' => $tenant->id]);
        Project::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->getJson('/api/v1/projects', [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'Projects fetched successfully');

        $this->assertCount(2, $response->json('data'));
    }

    #[Test]
    public function it_shows_a_single_project_for_own_tenant(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Ingest Worker',
            'framework_type' => 'nestjs',
        ]);

        $response = $this->getJson('/api/v1/projects/'.$project->id, [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $project->id)
            ->assertJsonPath('data.name', 'Ingest Worker')
            ->assertJsonPath('data.framework_type', 'nestjs');
    }

    #[Test]
    public function user_a_cannot_view_user_b_project(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->forTenant($tenantA)->create();
        $projectB = Project::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Secret Project B',
        ]);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/v1/projects/'.$projectB->id, [
            'X-API-Version' => 'v1',
        ]);

        $response->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'PROJECT_NOT_FOUND');
    }

    #[Test]
    public function user_a_cannot_update_user_b_project(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->forTenant($tenantA)->create();
        $projectB = Project::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Owned By B',
        ]);

        Sanctum::actingAs($userA);

        $response = $this->putJson('/api/v1/projects/'.$projectB->id, [
            'name' => 'Hijacked By A',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'PROJECT_NOT_FOUND');

        $this->assertDatabaseHas('projects', [
            'id' => $projectB->id,
            'name' => 'Owned By B',
        ]);
    }

    #[Test]
    public function user_a_cannot_delete_user_b_project(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA = User::factory()->forTenant($tenantA)->create();
        $projectB = Project::factory()->create([
            'tenant_id' => $tenantB->id,
        ]);

        Sanctum::actingAs($userA);

        $response = $this->deleteJson('/api/v1/projects/'.$projectB->id, [], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'PROJECT_NOT_FOUND');

        $this->assertDatabaseHas('projects', [
            'id' => $projectB->id,
        ]);
    }

    #[Test]
    public function it_updates_a_project(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Old Name',
            'framework_type' => 'react',
            'is_active' => true,
        ]);

        $response = $this->putJson('/api/v1/projects/'.$project->id, [
            'name' => 'Frontend Web',
            'framework_type' => 'react',
            'is_active' => false,
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Project updated successfully')
            ->assertJsonPath('data.name', 'Frontend Web')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Frontend Web',
            'is_active' => 0,
        ]);
    }

    #[Test]
    public function it_toggles_project_active_status(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/v1/projects/'.$project->id.'/toggle-active', [], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'is_active' => 0,
        ]);
    }

    #[Test]
    public function it_deletes_a_project(): void
    {
        [, $tenant] = $this->actingAsTenantUser();
        $project = Project::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $response = $this->deleteJson('/api/v1/projects/'.$project->id, [], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Project deleted successfully');

        $this->assertDatabaseMissing('projects', [
            'id' => $project->id,
        ]);
    }

    #[Test]
    public function deleting_a_tenant_cascades_and_removes_its_projects(): void
    {
        $tenant = Tenant::factory()->create();
        $keptTenant = Tenant::factory()->create();

        $cascaded = Project::factory()->count(2)->create([
            'tenant_id' => $tenant->id,
        ]);
        $kept = Project::factory()->create([
            'tenant_id' => $keptTenant->id,
            'name' => 'Should Remain',
        ]);

        $tenant->delete();

        foreach ($cascaded as $project) {
            $this->assertDatabaseMissing('projects', [
                'id' => $project->id,
            ]);
        }

        $this->assertDatabaseHas('projects', [
            'id' => $kept->id,
            'name' => 'Should Remain',
            'tenant_id' => $keptTenant->id,
        ]);
    }

    #[Test]
    public function it_returns_not_found_for_missing_project(): void
    {
        $this->actingAsTenantUser();

        $response = $this->getJson('/api/v1/projects/999999', [
            'X-API-Version' => 'v1',
        ]);

        $response->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'PROJECT_NOT_FOUND');
    }
}
