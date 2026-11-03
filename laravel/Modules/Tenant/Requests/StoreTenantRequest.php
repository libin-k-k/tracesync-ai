<?php

declare(strict_types=1);

namespace Modules\Tenant\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Tenant\Enums\SubscriptionPlan;

class StoreTenantRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'subscription_plan' => [
                'sometimes',
                'nullable',
                'string',
                Rule::enum(SubscriptionPlan::class),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The tenant name is required.',
            'name.max' => 'The tenant name may not be greater than 255 characters.',
            'subscription_plan.enum' => 'The subscription plan must be free, pro, or enterprise.',
        ];
    }

    /**
     * @return array{name: string, subscription_plan?: string|null}
     */
    public function validatedTenantData(): array
    {
        /** @var array{name: string, subscription_plan?: string|null} $data */
        $data = $this->validated();

        return $data;
    }
}
