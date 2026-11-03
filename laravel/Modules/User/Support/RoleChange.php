<?php

declare(strict_types=1);

namespace Modules\User\Support;

use App\Models\User;

/**
 * Resource passed into users.assign so ABAC can see the member and the requested role.
 */
final class RoleChange
{
    public function __construct(
        public readonly User $member,
        public readonly string $role,
    ) {}
}
