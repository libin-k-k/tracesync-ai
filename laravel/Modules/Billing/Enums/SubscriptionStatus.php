<?php

declare(strict_types=1);

namespace Modules\Billing\Enums;

/**
 * Local mirror of Razorpay subscription lifecycle states we persist.
 */
enum SubscriptionStatus: string
{
    case Created = 'created';
    case Active = 'active';
    case Halted = 'halted';
    case Cancelled = 'cancelled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Map a Razorpay webhook event name to a local status.
     */
    public static function fromWebhookEvent(string $event): ?self
    {
        return match ($event) {
            'subscription.authenticated',
            'subscription.activated',
            'subscription.charged',
            'subscription.resumed',
            'subscription.pending',
            'subscription.updated' => self::Active,
            'subscription.halted',
            'subscription.paused' => self::Halted,
            'subscription.cancelled',
            'subscription.completed' => self::Cancelled,
            'subscription.created' => self::Created,
            default => null,
        };
    }
}
