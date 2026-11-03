<?php

declare(strict_types=1);

namespace Modules\User\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Libinkk\ApiStarter\Facades\Api;
use Modules\User\Exceptions\MemberAccessException;
use Modules\User\Requests\AssignMemberRoleRequest;
use Modules\User\Requests\AssignProjectRequest;
use Modules\User\Requests\StoreMemberRequest;
use Modules\User\Services\UserManagementService;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private readonly UserManagementService $members,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::success(
                $this->members->directory($actor),
                'Members fetched successfully'
            );
        } catch (MemberAccessException $exception) {
            return $this->denied($exception);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to fetch members. Please try again later.',
                500,
                [],
                [],
                'MEMBER_INDEX_FAILED'
            );
        }
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::created(
                $this->members->create($actor, $request->memberData()),
                'Member created successfully'
            );
        } catch (MemberAccessException $exception) {
            return $this->denied($exception);
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to create member. Please try again later.',
                500,
                [],
                [],
                'MEMBER_CREATE_FAILED'
            );
        }
    }

    public function assignRole(AssignMemberRoleRequest $request, int $user): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->members->assignRole($actor, $user, $request->roleData()),
                'Member role updated successfully'
            );
        } catch (MemberAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Member not found.', 404, [], [], 'MEMBER_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to update the member role. Please try again later.',
                500,
                [],
                [],
                'MEMBER_ASSIGN_FAILED'
            );
        }
    }

    public function assignProject(AssignProjectRequest $request): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();

            return Api::updated(
                $this->members->assignProject($actor, $request->assignmentData()),
                'Project assignment saved'
            );
        } catch (MemberAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException $exception) {
            return Api::error($exception->getMessage() !== '' ? $exception->getMessage() : 'Not found.', 404, [], [], 'ASSIGNMENT_NOT_FOUND');
        } catch (ValidationException $exception) {
            return Api::validation($exception->errors(), $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to assign that project. Please try again later.',
                500,
                [],
                [],
                'ASSIGNMENT_FAILED'
            );
        }
    }

    public function destroy(Request $request, int $user): JsonResponse
    {
        try {
            /** @var User $actor */
            $actor = $request->user();
            $this->members->delete($actor, $user);

            return Api::deleted('Member removed successfully');
        } catch (MemberAccessException $exception) {
            return $this->denied($exception);
        } catch (ModelNotFoundException) {
            return Api::error('Member not found.', 404, [], [], 'MEMBER_NOT_FOUND');
        } catch (Throwable $exception) {
            report($exception);

            return Api::error(
                'Unable to remove the member. Please try again later.',
                500,
                [],
                [],
                'MEMBER_DELETE_FAILED'
            );
        }
    }

    private function denied(MemberAccessException $exception): JsonResponse
    {
        return Api::error(
            $exception->getMessage(),
            $exception->status,
            [],
            [],
            $exception->errorCode
        );
    }
}
