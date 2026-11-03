<?php

declare(strict_types=1);

namespace Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
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
            'group' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array{group?: string|null, description?: string|null, is_active?: bool}
     */
    public function permissionData(): array
    {
        /** @var array{group?: string|null, description?: string|null, is_active?: bool} $data */
        $data = $this->validated();

        return $data;
    }
}
