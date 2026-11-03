<?php

declare(strict_types=1);

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Modules\Billing\Database\Factories\SubscriptionFactory;
use Modules\Billing\Enums\SubscriptionStatus;
use Modules\Tenant\Models\Tenant;

/**
 * Razorpay-backed subscription for a tenant.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $razorpay_subscription_id
 * @property string $razorpay_plan_id
 * @property SubscriptionStatus $status
 * @property Carbon|null $current_term_start
 * @property Carbon|null $current_term_end
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Tenant $tenant
 */
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'razorpay_subscription_id',
        'razorpay_plan_id',
        'status',
        'current_term_start',
        'current_term_end',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'status' => SubscriptionStatus::class,
            'current_term_start' => 'datetime',
            'current_term_end' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return Factory<Subscription>
     */
    protected static function newFactory(): Factory
    {
        return SubscriptionFactory::new();
    }
}
