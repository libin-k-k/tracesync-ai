export type FrameworkType = 'laravel' | 'nestjs' | 'react' | 'node';

export const FRAMEWORK_OPTIONS: Array<{ value: FrameworkType; label: string }> = [
  { value: 'laravel', label: 'Laravel' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'react', label: 'React' },
  { value: 'node', label: 'Node' },
];

export type Project = {
  id: number;
  tenant_id: number;
  name: string;
  framework_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateProjectPayload = {
  name: string;
  framework_type: FrameworkType;
  is_active?: boolean;
};

export type ProjectListResponse =
  | Project[]
  | {
      data: Project[];
      current_page?: number;
      last_page?: number;
      per_page?: number;
      total?: number;
    };
