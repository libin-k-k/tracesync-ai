<?php

declare(strict_types=1);

namespace Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => [
                'required',
                'string',
                Rule::exists('roles', 'name')->whereNull('deleted_at')->where('is_active', true),
            ],
            'team_name' => ['required_if:role,Team Leader', 'nullable', 'string', 'max:255'],
            'manager_id' => ['sometimes', 'nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.unique' => 'This email is already registered.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
            'role.exists' => 'Choose a valid role.',
            'team_name.required_if' => 'A team name is required for a team leader.',
        ];
    }

    /**
     * @return array{name: string, email: string, password: string, role: string, team_name?: string|null, manager_id?: int|null}
     */
    public function memberData(): array
    {
        /** @var array{name: string, email: string, password: string, role: string, team_name?: string|null, manager_id?: int|null} $data */
        $data = $this->validated();

        return $data;
    }
}
