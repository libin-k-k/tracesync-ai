<?php

declare(strict_types=1);

namespace Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AssignProjectRequest extends FormRequest
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
            'project_id' => ['required', 'integer'],
            'team_id' => ['nullable', 'integer'],
            'user_id' => ['nullable', 'integer'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasTeam = $this->filled('team_id');
            $hasUser = $this->filled('user_id');

            if ($hasTeam === $hasUser) {
                $validator->errors()->add('team_id', 'Assign the project to a team or to one developer.');
            }
        });
    }

    /**
     * @return array{project_id: int, team_id?: int|null, user_id?: int|null}
     */
    public function assignmentData(): array
    {
        /** @var array{project_id: int, team_id?: int|null, user_id?: int|null} $data */
        $data = $this->validated();

        return $data;
    }
}
