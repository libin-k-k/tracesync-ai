<?php

declare(strict_types=1);

namespace Modules\User\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Libinkk\Permission\Authorization\AuthorizationContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bind the authenticated workspace so libinkk checks the tenant-scoped role.
 */
class SetAuthorizationTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->tenant_id !== null) {
            $user->loadMissing('tenant');

            if ($user->tenant !== null) {
                AuthorizationContext::tenant($user->tenant);
            }
        }

        return $next($request);
    }
}
