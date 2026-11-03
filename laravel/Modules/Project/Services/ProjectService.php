<?php

declare(strict_types=1);

namespace Modules\Project\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Modules\Project\Models\Project;
use Modules\Tenant\Models\Tenant;
use Throwable;

class ProjectService
{
    /**
     * @param  array{tenant_id?: int|null, is_active?: bool|null, per_page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Project>|Collection<int, Project>
     */
    public function list(array $filters = [], bool $paginate = true): LengthAwarePaginator|Collection
    {
        $query = Project::query()
            ->with('tenant')
            ->when(
                isset($filters['tenant_id']),
                fn ($builder) => $builder->where('tenant_id', $filters['tenant_id'])
            )
            ->when(
                array_key_exists('is_active', $filters) && $filters['is_active'] !== null,
                fn ($builder) => $builder->where('is_active', (bool) $filters['is_active'])
            )
            ->orderByDesc('id');

        if (! $paginate) {
            return $query->get();
        }

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        return $query->paginate($perPage);
    }

    /**
     * List projects visible to the authenticated user (tenant-scoped).
     *
     * @param  array{tenant_id?: int|null, is_active?: bool|null, per_page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Project>|Collection<int, Project>
     */
    public function listForUser(User $user, array $filters = [], bool $paginate = true): LengthAwarePaginator|Collection
    {
        if (! $user->isSuperAdmin()) {
            $filters['tenant_id'] = $user->tenant_id;
        }

        return $this->list($filters, $paginate);
    }

    /**
     * @param  array{tenant_id: int, name: string, framework_type: string, is_active?: bool}  $data
     *
     * @throws ModelNotFoundException
     * @throws Throwable
     */
    public function create(array $data): Project
    {
        return DB::transaction(function () use ($data): Project {
            $tenant = Tenant::query()->findOrFail($data['tenant_id']);

            $project = new Project;
            $project->tenant_id = $tenant->id;
            $project->name = $data['name'];
            $project->framework_type = $data['framework_type'];
            $project->is_active = $data['is_active'] ?? true;
            $project->save();

            return $project->load('tenant');
        });
    }

    /**
     * @throws ModelNotFoundException
     */
    public function find(int $id): Project
    {
        return Project::query()
            ->with('tenant')
            ->findOrFail($id);
    }

    /**
     * Resolve a project only when it belongs to the user's tenant (unless super admin).
     *
     * @throws ModelNotFoundException
     */
    public function findForUser(int $id, User $user): Project
    {
        $query = Project::query()
            ->with('tenant')
            ->whereKey($id);

        if (! $user->isSuperAdmin()) {
            $query->where('tenant_id', $user->tenant_id);
        }

        return $query->findOrFail($id);
    }

    /**
     * @param  array{name?: string, framework_type?: string, is_active?: bool, tenant_id?: int}  $data
     *
     * @throws ModelNotFoundException
     * @throws Throwable
     */
    public function update(Project $project, array $data): Project
    {
        return DB::transaction(function () use ($project, $data): Project {
            if (array_key_exists('tenant_id', $data) && $data['tenant_id'] !== null) {
                $tenant = Tenant::query()->findOrFail((int) $data['tenant_id']);
                $project->tenant_id = $tenant->id;
            }

            if (array_key_exists('name', $data) && $data['name'] !== null) {
                $project->name = $data['name'];
            }

            if (array_key_exists('framework_type', $data) && $data['framework_type'] !== null) {
                $project->framework_type = $data['framework_type'];
            }

            if (array_key_exists('is_active', $data) && $data['is_active'] !== null) {
                $project->is_active = (bool) $data['is_active'];
            }

            $project->save();

            return $project->refresh()->load('tenant');
        });
    }

    /**
     * Flip the project's is_active flag.
     *
     * @throws Throwable
     */
    public function toggleActive(Project $project): Project
    {
        return DB::transaction(function () use ($project): Project {
            $project->is_active = ! $project->is_active;
            $project->save();

            return $project->refresh()->load('tenant');
        });
    }

    /**
     * @throws Throwable
     */
    public function delete(Project $project): void
    {
        DB::transaction(static function () use ($project): void {
            $project->delete();
        });
    }
}
