<?php

declare(strict_types=1);

namespace Modules\Auth\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Libinkk\ApiStarter\Facades\Api;
use Libinkk\OneAuth\Exceptions\AuthenticationException;
use Libinkk\OneAuth\Exceptions\OneAuthException;
use Modules\Auth\Requests\LoginRequest;
use Modules\Auth\Requests\RegisterRequest;
use Modules\Auth\Services\AuthService;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $payload = $this->authService->register($request->validatedRegistrationData());

            return Api::created($payload, 'Registration successful');
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (AuthenticationException $exception) {
            return Api::error(
                $exception->getMessage(),
                $exception->status(),
                [],
                [],
                $exception->errorCode()
            );
        } catch (OneAuthException $exception) {
            return Api::error(
                $exception->getMessage(),
                $exception->status(),
                [],
                [],
                $exception->errorCode()
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to register. Please try again later.',
                500,
                [],
                [],
                'AUTH_REGISTER_FAILED'
            );
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $payload = $this->authService->login($request->validatedLoginData());

            return Api::success($payload, 'Login successful');
        } catch (ValidationException $exception) {
            return Api::validation(
                $exception->errors(),
                $exception->getMessage(),
                422
            );
        } catch (AuthenticationException $exception) {
            return Api::error(
                $exception->getMessage(),
                $exception->status(),
                [],
                [],
                $exception->errorCode()
            );
        } catch (OneAuthException $exception) {
            return Api::error(
                $exception->getMessage(),
                $exception->status(),
                [],
                [],
                $exception->errorCode()
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to login. Please try again later.',
                500,
                [],
                [],
                'AUTH_LOGIN_FAILED'
            );
        }
    }

    /**
     * Authenticated profile with tenant credentials for Settings UI.
     */
    public function me(Request $request): JsonResponse
    {
        try {
            /** @var User|null $user */
            $user = $request->user();

            if ($user === null) {
                return Api::error(
                    'Unauthenticated.',
                    401,
                    [],
                    [],
                    'UNAUTHENTICATED'
                );
            }

            $user->load('tenant');

            if ($user->tenant !== null) {
                $user->tenant->makeVisible(['api_key']);
            }

            return Api::success(
                [
                    'user' => $user,
                    'tenant' => $user->tenant,
                ],
                'Profile fetched successfully'
            );
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to fetch profile. Please try again later.',
                500,
                [],
                [],
                'AUTH_PROFILE_FAILED'
            );
        }
    }
}
