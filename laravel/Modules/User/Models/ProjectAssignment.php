<?php

declare(strict_types=1);

namespace Modules\User\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Project\Models\Project;

/**
 * A project is assigned either to a team or to one developer.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $project_id
 * @property int|null $team_id
 * @property int|null $user_id
 * @property int|null $assigned_by
 */
class ProjectAssignment extends Model
{
    protected $fillable = [
        'tenant_id',
        'project_id',
        'team_id',
        'user_id',
        'assigned_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'project_id' => 'integer',
            'team_id' => 'integer',
            'user_id' => 'integer',
            'assigned_by' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function developer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
