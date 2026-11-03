import { apiClient } from './client'
import type { ApiSuccessEnvelope } from '../types/api'
import type {
  AccessPayload,
  AccessPermission,
  AccessRole,
  CreatePermissionPayload,
  CreateRolePayload,
  UpdatePermissionPayload,
  UpdateRolePayload,
} from '../types/role'

export async function fetchAccessMe(): Promise<AccessPayload> {
  const response = await apiClient.get<ApiSuccessEnvelope<AccessPayload>>('/api/v1/access/me')

  return response.data.data
}

export async function fetchRoles(): Promise<AccessRole[]> {
  const response = await apiClient.get<ApiSuccessEnvelope<AccessRole[]>>('/api/v1/roles')

  return response.data.data
}

export async function createRole(payload: CreateRolePayload): Promise<AccessRole> {
  const response = await apiClient.post<ApiSuccessEnvelope<AccessRole>>('/api/v1/roles', payload)

  return response.data.data
}

export async function updateRole(id: number, payload: UpdateRolePayload): Promise<AccessRole> {
  const response = await apiClient.patch<ApiSuccessEnvelope<AccessRole>>(
    `/api/v1/roles/${id}`,
    payload,
  )

  return response.data.data
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/roles/${id}`)
}

export async function syncRolePermissions(id: number, permissions: string[]): Promise<AccessRole> {
  const response = await apiClient.put<ApiSuccessEnvelope<AccessRole>>(
    `/api/v1/roles/${id}/permissions`,
    { permissions },
  )

  return response.data.data
}

export async function fetchPermissions(): Promise<AccessPermission[]> {
  const response = await apiClient.get<ApiSuccessEnvelope<AccessPermission[]>>('/api/v1/permissions')

  return response.data.data
}

export async function createPermission(payload: CreatePermissionPayload): Promise<AccessPermission> {
  const response = await apiClient.post<ApiSuccessEnvelope<AccessPermission>>(
    '/api/v1/permissions',
    payload,
  )

  return response.data.data
}

export async function updatePermission(
  id: number,
  payload: UpdatePermissionPayload,
): Promise<AccessPermission> {
  const response = await apiClient.patch<ApiSuccessEnvelope<AccessPermission>>(
    `/api/v1/permissions/${id}`,
    payload,
  )

  return response.data.data
}

export async function deletePermission(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/permissions/${id}`)
}
