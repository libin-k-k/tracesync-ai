<?php

declare(strict_types=1);

namespace Modules\Auth\Services;

use App\Models\User;
use Libinkk\OneAuth\Exceptions\AuthenticationException;
use Libinkk\OneAuth\Facades\OneAuth;
use Modules\Tenant\Models\Tenant;
use Modules\Tenant\Services\TenantService;
use Modules\User\Services\AccessCatalog;
use Throwable;

class AuthService
{
    public function __construct(
        private readonly TenantService $tenantService,
    ) {}

    /**
     * Register a user, provision their tenant, assign Admin, and return a Sanctum token.
     *
     * @param  array{name: string, email: string, password: string, tenant_name?: string}  $data
     * @return array{user: User, token: string, tenant: Tenant}
     *
     * @throws Throwable
     */
    public function register(array $data): array
    {
        $tenantName = $data['tenant_name'] ?? trim($data['name']).' Workspace';

        $tenant = $this->tenantService->create([
            'name' => $tenantName,
        ]);

        try {
            $registered = OneAuth::register([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            /** @var User $user */
            $user = $registered['user'];
            $user->forceFill(['tenant_id' => $tenant->id])->save();

            AccessCatalog::sync();
            $user->assignRole('Admin', $tenant);
            $user->assignRole('Admin');

            $login = OneAuth::login([
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            /** @var User $authenticated */
            $authenticated = $login['user'];
            $authenticated->load('tenant');

            $tenant->makeVisible(['api_key']);

            return [
                'user' => $authenticated,
                'token' => (string) $login['token'],
                'tenant' => $tenant,
            ];
        } catch (Throwable $exception) {
            $tenant->delete();

            throw $exception;
        }
    }

    /**
     * Authenticate credentials and return a Sanctum token payload.
     *
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     *
     * @throws AuthenticationException
     */
    public function login(array $credentials): array
    {
        $result = OneAuth::login([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ]);

        /** @var User $user */
        $user = $result['user'];
        $user->load('tenant');

        return [
            'user' => $user,
            'token' => (string) $result['token'],
        ];
    }
}
