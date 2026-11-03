<?php

declare(strict_types=1);

namespace Modules\Project\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tenant_id' => ['sometimes', 'integer', Rule::exists('tenants', 'id')],
            'name' => ['sometimes', 'string', 'max:255'],
            'framework_type' => ['sometimes', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tenant_id.exists' => 'The selected tenant does not exist.',
            'name.max' => 'The project name may not be greater than 255 characters.',
        ];
    }

    /**
     * @return array{tenant_id?: int, name?: string, framework_type?: string, is_active?: bool}
     */
    public function validatedProjectData(): array
    {
        /** @var array{tenant_id?: int, name?: string, framework_type?: string, is_active?: bool} $data */
        $data = $this->validated();

        return $data;
    }
}
