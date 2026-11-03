<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $ingest = \Mockery::mock();
        $ingest->shouldReceive('set')->andReturn('OK');
        $ingest->shouldReceive('del')->andReturn(1);

        Redis::shouldReceive('connection')
            ->with('ingest')
            ->andReturn($ingest);
    }

    #[Test]
    public function it_registers_a_user_with_tenant_and_admin_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'tenant_name' => 'Analytical Engine Co',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('message', 'Registration successful')
            ->assertJsonPath('data.user.email', 'ada@example.com')
            ->assertJsonPath('data.tenant.name', 'Analytical Engine Co')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'tenant_id'],
                    'token',
                    'tenant' => ['id', 'name', 'api_key'],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));

        $user = User::query()->where('email', 'ada@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->tenant_id);
        $this->assertTrue(
            $user->roles()->where('name', 'Admin')->exists(),
            'Registered user should have the Admin role assigned.'
        );
        $this->assertTrue($user->hasRole('Admin'));
        $this->assertDatabaseHas('roles', ['name' => 'Admin']);
    }

    #[Test]
    public function it_logs_in_with_valid_credentials(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Grace Hopper',
            'email' => 'grace@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'tenant_name' => 'Navy Computing',
        ], [
            'X-API-Version' => 'v1',
        ])->assertCreated();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'grace@example.com',
            'password' => 'Password1',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('message', 'Login successful')
            ->assertJsonPath('data.user.email', 'grace@example.com')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'email', 'tenant_id'],
                    'token',
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    #[Test]
    public function it_rejects_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'valid@example.com',
            'password' => 'Password1',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'valid@example.com',
            'password' => 'WrongPassword1',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('status', 401)
            ->assertJsonPath('error_code', 'AUTHENTICATION_FAILED');
    }

    #[Test]
    public function it_rejects_login_for_unknown_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'Password1',
        ], [
            'X-API-Version' => 'v1',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'AUTHENTICATION_FAILED');
    }
}
