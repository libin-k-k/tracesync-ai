export type RolePermissionRef = {
  id: number
  name: string
  group: string | null
  is_system: boolean
}

export type AccessRole = {
  id: number
  name: string
  slug: string
  description: string | null
  is_system: boolean
  is_active: boolean
  priority: number
  permissions: RolePermissionRef[]
}

export type AccessPermission = {
  id: number
  name: string
  slug: string
  resource: string | null
  action: string | null
  group: string | null
  description: string | null
  is_system: boolean
  is_active: boolean
}

export type AccessPayload = {
  role: string | null
  permissions: string[]
  abilities: {
    roles_view: boolean
    roles_manage: boolean
    permissions_view: boolean
    permissions_manage: boolean
  }
}

export type CreateRolePayload = {
  name: string
  description?: string | null
  permissions?: string[]
}

export type UpdateRolePayload = {
  name?: string
  description?: string | null
  is_active?: boolean
}

export type CreatePermissionPayload = {
  name: string
  group?: string | null
  description?: string | null
}

export type UpdatePermissionPayload = {
  group?: string | null
  description?: string | null
  is_active?: boolean
}
