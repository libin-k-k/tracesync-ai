import { apiClient } from './client';
import type { ApiSuccessEnvelope } from '../types/api';
import type {
  CreateProjectPayload,
  Project,
  ProjectListResponse,
} from '../types/project';

export function normalizeProjects(payload: ProjectListResponse): Project[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient.get<
    ApiSuccessEnvelope<ProjectListResponse>
  >('/api/v1/projects');

  return normalizeProjects(response.data.data);
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const response = await apiClient.post<ApiSuccessEnvelope<Project>>(
    '/api/v1/projects',
    payload,
  );

  return response.data.data;
}
