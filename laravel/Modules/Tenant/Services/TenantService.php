<?php

declare(strict_types=1);

namespace Modules\Tenant\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Modules\Tenant\Enums\SubscriptionPlan;
use Modules\Tenant\Models\Tenant;
use RuntimeException;
use Throwable;

class TenantService
{
    public const REDIS_API_KEY_PREFIX = 'tenant_api_key:';

    private const API_KEY_PREFIX = 'ts_live_';

    private const API_KEY_RANDOM_BYTES = 16;

    private const API_KEY_MAX_ATTEMPTS = 10;

    /**
     * Onboard a new tenant with a unique secure API key and sync it to Redis.
     *
     * @param  array{name: string, subscription_plan?: string|null}  $data
     *
     * @throws RuntimeException
     * @throws Throwable
     */
    public function create(array $data): Tenant
    {
        $tenant = DB::transaction(function () use ($data): Tenant {
            $tenant = new Tenant();
            $tenant->name = $data['name'];
            $tenant->api_key = $this->generateUniqueApiKey();
            $tenant->subscription_plan = $this->resolveSubscriptionPlan(
                $data['subscription_plan'] ?? null
            );
            $tenant->save();

            return $tenant->fresh() ?? $tenant;
        });

        $this->syncApiKeyToRedis($tenant);

        return $tenant;
    }

    /**
     * Rotate the tenant API key, remove the old Redis mapping, and sync the new key.
     *
     * @throws RuntimeException
     * @throws Throwable
     */
    public function rotateApiKey(Tenant $tenant): Tenant
    {
        $previousApiKey = $tenant->api_key;

        $tenant = DB::transaction(function () use ($tenant): Tenant {
            $tenant->api_key = $this->generateUniqueApiKey();
            $tenant->save();

            return $tenant->fresh() ?? $tenant;
        });

        if (filled($previousApiKey)) {
            $this->forgetApiKeyFromRedis((string) $previousApiKey);
        }

        $this->syncApiKeyToRedis($tenant);

        return $tenant;
    }

    /**
     * Persist API key → tenant id mapping for NestJS ingest auth.
     * Uses the unprefixed `ingest` Redis connection so NestJS can read the same key.
     */
    public function syncApiKeyToRedis(Tenant $tenant): void
    {
        Redis::connection('ingest')->set(
            self::REDIS_API_KEY_PREFIX.$tenant->api_key,
            (string) $tenant->id
        );
    }

    /**
     * Remove a rotated/revoked API key mapping from Redis.
     */
    public function forgetApiKeyFromRedis(string $apiKey): void
    {
        Redis::connection('ingest')->del(self::REDIS_API_KEY_PREFIX.$apiKey);
    }

    /**
     * Generate a unique key: ts_live_ + 32 secure hex characters.
     *
     * @throws RuntimeException
     */
    public function generateUniqueApiKey(): string
    {
        for ($attempt = 0; $attempt < self::API_KEY_MAX_ATTEMPTS; $attempt++) {
            $apiKey = self::API_KEY_PREFIX.bin2hex(random_bytes(self::API_KEY_RANDOM_BYTES));

            $exists = Tenant::query()
                ->where('api_key', $apiKey)
                ->exists();

            if (! $exists) {
                return $apiKey;
            }
        }

        throw new RuntimeException('Unable to generate a unique tenant API key.');
    }

    private function resolveSubscriptionPlan(?string $plan): SubscriptionPlan
    {
        if ($plan === null || $plan === '') {
            return SubscriptionPlan::Free;
        }

        return SubscriptionPlan::from($plan);
    }
}
