<?php

declare(strict_types=1);

namespace Modules\Tenant\Enums;

/**
 * Tenant subscription tiers for TraceSync AI billing.
 */
enum SubscriptionPlan: string
{
    case Free = 'free';
    case Pro = 'pro';
    case Enterprise = 'enterprise';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
