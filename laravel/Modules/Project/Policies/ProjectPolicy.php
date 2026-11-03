<?php

declare(strict_types=1);

namespace Modules\Project\Policies;

use App\Models\User;
use Modules\Project\Models\Project;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->can('projects.view');
    }

    public function view(User $user, Project $project): bool
    {
        return $this->belongsToUserTenant($user, $project)
            && ($user->isSuperAdmin() || $user->can('projects.view'));
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->can('projects.create');
    }

    public function update(User $user, Project $project): bool
    {
        return $this->belongsToUserTenant($user, $project)
            && ($user->isSuperAdmin() || $user->can('projects.update'));
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->belongsToUserTenant($user, $project)
            && ($user->isSuperAdmin() || $user->can('projects.delete'));
    }

    private function belongsToUserTenant(User $user, Project $project): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->tenant_id !== null
            && (int) $user->tenant_id === (int) $project->tenant_id;
    }
}
