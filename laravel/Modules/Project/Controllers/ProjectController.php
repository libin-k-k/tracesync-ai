<?php

declare(strict_types=1);

namespace Modules\Project\Controllers;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Libinkk\ApiStarter\Facades\Api;
use Modules\Project\Models\Project;
use Modules\Project\Requests\StoreProjectRequest;
use Modules\Project\Requests\UpdateProjectRequest;
use Modules\Project\Services\ProjectService;
use Throwable;

class ProjectController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ProjectService $projectService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $this->authorize('viewAny', Project::class);

            $filters = [
                'tenant_id' => $request->filled('tenant_id') ? (int) $request->input('tenant_id') : null,
                'is_active' => $request->has('is_active')
                    ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                    : null,
                'per_page' => $request->filled('per_page') ? (int) $request->input('per_page') : 15,
            ];

            $projects = $this->projectService->listForUser(
                $user,
                array_filter(
                    $filters,
                    static fn (mixed $value, string $key): bool => $key === 'is_active' || $value !== null,
                    ARRAY_FILTER_USE_BOTH
                )
            );

            return Api::success($projects, 'Projects fetched successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to list projects.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to fetch projects. Please try again later.',
                500,
                [],
                [],
                'PROJECT_INDEX_FAILED'
            );
        }
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $this->authorize('create', Project::class);

            $data = $request->validatedProjectData();

            if (! $user->isSuperAdmin()) {
                $data['tenant_id'] = (int) $user->tenant_id;
            }

            if (! isset($data['tenant_id'])) {
                return Api::validation(
                    ['tenant_id' => ['A valid tenant_id is required.']],
                    'Validation failed.',
                    422
                );
            }

            $project = $this->projectService->create($data);

            return Api::created($project, 'Project created successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to create projects.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (ModelNotFoundException $exception) {
            return Api::error(
                'Tenant not found.',
                404,
                [],
                [],
                'TENANT_NOT_FOUND'
            );
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to create project. Please try again later.',
                500,
                [],
                [],
                'PROJECT_CREATE_FAILED'
            );
        }
    }

    public function show(Request $request, int $project): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $model = $this->projectService->findForUser($project, $user);
            $this->authorize('view', $model);

            return Api::success($model, 'Project fetched successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to view this project.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (ModelNotFoundException $exception) {
            return Api::error(
                'Project not found.',
                404,
                [],
                [],
                'PROJECT_NOT_FOUND'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to fetch project. Please try again later.',
                500,
                [],
                [],
                'PROJECT_SHOW_FAILED'
            );
        }
    }

    public function update(UpdateProjectRequest $request, int $project): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $model = $this->projectService->findForUser($project, $user);
            $this->authorize('update', $model);

            $data = $request->validatedProjectData();

            if (! $user->isSuperAdmin()) {
                unset($data['tenant_id']);
            }

            $updated = $this->projectService->update($model, $data);

            return Api::updated($updated, 'Project updated successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to update this project.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (ModelNotFoundException $exception) {
            return Api::error(
                'Project not found.',
                404,
                [],
                [],
                'PROJECT_NOT_FOUND'
            );
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to update project. Please try again later.',
                500,
                [],
                [],
                'PROJECT_UPDATE_FAILED'
            );
        }
    }

    public function toggleActive(Request $request, int $project): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $model = $this->projectService->findForUser($project, $user);
            $this->authorize('update', $model);
            $updated = $this->projectService->toggleActive($model);

            return Api::updated($updated, 'Project active status toggled successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to update this project.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (ModelNotFoundException $exception) {
            return Api::error(
                'Project not found.',
                404,
                [],
                [],
                'PROJECT_NOT_FOUND'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to toggle project status. Please try again later.',
                500,
                [],
                [],
                'PROJECT_TOGGLE_FAILED'
            );
        }
    }

    public function destroy(Request $request, int $project): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();
            $model = $this->projectService->findForUser($project, $user);
            $this->authorize('delete', $model);
            $this->projectService->delete($model);

            return Api::deleted('Project deleted successfully');
        } catch (AuthorizationException $exception) {
            return Api::error(
                'You are not authorized to delete this project.',
                403,
                [],
                [],
                'PROJECT_FORBIDDEN'
            );
        } catch (ModelNotFoundException $exception) {
            return Api::error(
                'Project not found.',
                404,
                [],
                [],
                'PROJECT_NOT_FOUND'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to delete project. Please try again later.',
                500,
                [],
                [],
                'PROJECT_DELETE_FAILED'
            );
        }
    }
}
