<?php

declare(strict_types=1);

namespace Modules\Role\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRolePermissionsRequest extends FormRequest
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
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ];
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        /** @var array{permissions: list<string>} $data */
        $data = $this->validated();

        return array_values(array_unique($data['permissions']));
    }
}
