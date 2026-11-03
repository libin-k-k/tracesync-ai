<?php

declare(strict_types=1);

namespace Modules\Tenant\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Modules\Billing\Models\Subscription;
use Modules\Project\Models\Project;
use Modules\Tenant\Database\Factories\TenantFactory;
use Modules\Tenant\Enums\SubscriptionPlan;
use Modules\Tenant\Services\TenantService;

/**
 * B2B SaaS organization (company) that owns projects and users.
 *
 * @property int $id
 * @property string $name
 * @property string $api_key
 * @property SubscriptionPlan $subscription_plan
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Project> $projects
 * @property-read Collection<int, Subscription> $subscriptions
 * @property-read Collection<int, User> $users
 */
class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'api_key',
        'subscription_plan',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'api_key',
    ];

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant): void {
            if (! filled($tenant->api_key)) {
                $tenant->api_key = app(TenantService::class)->generateUniqueApiKey();
            }

            if ($tenant->subscription_plan === null) {
                $tenant->subscription_plan = SubscriptionPlan::Free;
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subscription_plan' => SubscriptionPlan::class,
        ];
    }

    /**
     * @return HasMany<Project, $this>
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Regenerate a unique secure API key and sync Redis via TenantService.
     */
    public function rotateApiKey(): string
    {
        $updated = app(TenantService::class)->rotateApiKey($this);
        $this->refresh();

        return $updated->api_key;
    }

    /**
     * @return Factory<Tenant>
     */
    protected static function newFactory(): Factory
    {
        return TenantFactory::new();
    }
}
