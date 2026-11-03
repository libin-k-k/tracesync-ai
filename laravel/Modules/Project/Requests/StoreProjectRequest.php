<?php

declare(strict_types=1);

namespace Modules\Project\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
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
        /** @var User|null $user */
        $user = $this->user();
        $tenantIdRules = ['sometimes', 'integer', Rule::exists('tenants', 'id')];

        if ($user !== null && $user->isSuperAdmin()) {
            $tenantIdRules = ['required', 'integer', Rule::exists('tenants', 'id')];
        }

        return [
            'tenant_id' => $tenantIdRules,
            'name' => ['required', 'string', 'max:255'],
            'framework_type' => ['required', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tenant_id.required' => 'A valid tenant_id is required.',
            'tenant_id.exists' => 'The selected tenant does not exist.',
            'name.required' => 'The project name is required.',
            'framework_type.required' => 'The framework_type is required.',
        ];
    }

    /**
     * @return array{tenant_id?: int, name: string, framework_type: string, is_active?: bool}
     */
    public function validatedProjectData(): array
    {
        /** @var array{tenant_id?: int, name: string, framework_type: string, is_active?: bool} $data */
        $data = $this->validated();

        return $data;
    }
}
