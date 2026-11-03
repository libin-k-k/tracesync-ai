<?php

declare(strict_types=1);

namespace Tests\Unit\Tenant;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Modules\Tenant\Services\TenantService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TenantServiceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_syncs_api_key_to_redis_when_creating_a_tenant(): void
    {
        $capturedKey = null;
        $capturedValue = null;

        $ingest = \Mockery::mock();
        $ingest->shouldReceive('set')
            ->once()
            ->withArgs(function (string $key, string $tenantId) use (&$capturedKey, &$capturedValue): bool {
                $capturedKey = $key;
                $capturedValue = $tenantId;

                return true;
            })
            ->andReturn('OK');

        Redis::shouldReceive('connection')
            ->once()
            ->with('ingest')
            ->andReturn($ingest);

        /** @var TenantService $service */
        $service = $this->app->make(TenantService::class);

        $tenant = $service->create([
            'name' => 'Redis Sync Tenant',
        ]);

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'name' => 'Redis Sync Tenant',
            'api_key' => $tenant->api_key,
        ]);

        $this->assertStringStartsWith('ts_live_', $tenant->api_key);
        $this->assertSame(
            TenantService::REDIS_API_KEY_PREFIX.$tenant->api_key,
            $capturedKey
        );
        $this->assertSame((string) $tenant->id, $capturedValue);
    }

    #[Test]
    public function it_forgets_old_redis_key_and_syncs_new_key_on_rotate(): void
    {
        $ingest = \Mockery::mock();

        $ingest->shouldReceive('set')
            ->once()
            ->andReturn('OK');

        Redis::shouldReceive('connection')
            ->once()
            ->with('ingest')
            ->andReturn($ingest);

        /** @var TenantService $service */
        $service = $this->app->make(TenantService::class);

        $tenant = $service->create([
            'name' => 'Rotate Tenant',
        ]);

        $oldApiKey = $tenant->api_key;

        $ingest->shouldReceive('del')
            ->once()
            ->with(TenantService::REDIS_API_KEY_PREFIX.$oldApiKey)
            ->andReturn(1);

        $capturedKey = null;
        $capturedValue = null;

        $ingest->shouldReceive('set')
            ->once()
            ->withArgs(function (string $key, string $tenantId) use (&$capturedKey, &$capturedValue): bool {
                $capturedKey = $key;
                $capturedValue = $tenantId;

                return true;
            })
            ->andReturn('OK');

        Redis::shouldReceive('connection')
            ->twice()
            ->with('ingest')
            ->andReturn($ingest);

        $rotated = $service->rotateApiKey($tenant);

        $this->assertNotSame($oldApiKey, $rotated->api_key);
        $this->assertSame(
            TenantService::REDIS_API_KEY_PREFIX.$rotated->api_key,
            $capturedKey
        );
        $this->assertSame((string) $rotated->id, $capturedValue);
    }
}
