import { apiClient } from './client'
import type { ApiSuccessEnvelope } from '../types/api'
import type {
  AssignProjectPayload,
  CreateMemberPayload,
  Member,
  MemberDirectory,
  WorkspaceRole,
} from '../types/member'

export async function fetchMembers(): Promise<MemberDirectory> {
  const response = await apiClient.get<ApiSuccessEnvelope<MemberDirectory>>('/api/v1/users')

  return response.data.data
}

export async function createMember(payload: CreateMemberPayload): Promise<Member> {
  const response = await apiClient.post<ApiSuccessEnvelope<Member>>('/api/v1/users', payload)

  return response.data.data
}

export async function assignMemberRole(id: number, role: WorkspaceRole): Promise<Member> {
  const response = await apiClient.patch<ApiSuccessEnvelope<Member>>(`/api/v1/users/${id}/role`, {
    role,
  })

  return response.data.data
}

export async function removeMember(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/users/${id}`)
}

export async function assignProject(payload: AssignProjectPayload): Promise<void> {
  await apiClient.put('/api/v1/project-assignments', payload)
}
