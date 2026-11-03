<?php

declare(strict_types=1);

namespace Modules\Billing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeRequest extends FormRequest
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
            'plan_id' => ['required', 'string', 'max:191'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required' => 'A Razorpay plan_id is required.',
        ];
    }

    public function planId(): string
    {
        return (string) $this->validated('plan_id');
    }
}
