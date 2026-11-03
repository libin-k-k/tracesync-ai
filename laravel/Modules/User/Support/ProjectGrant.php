<?php

declare(strict_types=1);

namespace Modules\User\Support;

use App\Models\User;
use Modules\Project\Models\Project;
use Modules\User\Models\Team;

/**
 * Resource for the projects.assign attribute check.
 */
final class ProjectGrant
{
    public function __construct(
        public readonly Project $project,
        public readonly ?Team $team = null,
        public readonly ?User $developer = null,
    ) {}
}
