<?php

declare(strict_types=1);

namespace Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ];
    }

    /**
     * @return array{name: string, description?: string|null, permissions?: list<string>}
     */
    public function roleData(): array
    {
        /** @var array{name: string, description?: string|null, permissions?: list<string>} $data */
        $data = $this->validated();

        return $data;
    }
}
