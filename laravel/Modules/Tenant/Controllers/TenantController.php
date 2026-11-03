<?php

declare(strict_types=1);

namespace Modules\Tenant\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Libinkk\ApiStarter\Facades\Api;
use Modules\Tenant\Requests\StoreTenantRequest;
use Modules\Tenant\Services\TenantService;
use Throwable;

class TenantController extends Controller
{
    public function __construct(
        private readonly TenantService $tenantService,
    ) {}

    /**
     * Create (onboard) a new tenant.
     */
    public function store(StoreTenantRequest $request): JsonResponse
    {
        try {
            $tenant = $this->tenantService->create($request->validatedTenantData());
            $tenant->makeVisible(['api_key']);

            return Api::created($tenant, 'Tenant created successfully');
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to create tenant. Please try again later.',
                500,
                [],
                [],
                'TENANT_CREATE_FAILED'
            );
        }
    }
}
