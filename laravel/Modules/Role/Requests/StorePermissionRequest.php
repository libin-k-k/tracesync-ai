<?php

declare(strict_types=1);

namespace Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:150'],
            'group' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array{name: string, group?: string|null, description?: string|null}
     */
    public function permissionData(): array
    {
        /** @var array{name: string, group?: string|null, description?: string|null} $data */
        $data = $this->validated();

        return $data;
    }
}
