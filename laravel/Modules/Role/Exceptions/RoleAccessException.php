<?php

declare(strict_types=1);

namespace Modules\Role\Exceptions;

use RuntimeException;

class RoleAccessException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly string $errorCode,
    ) {
        parent::__construct($message);
    }
}
