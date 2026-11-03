export type WorkspaceRole = string

export type RoleDefinition = {
  name: WorkspaceRole
  rank: number
  description: string
  is_system?: boolean
}

export type PersonRef = {
  id: number
  name: string
}

export type TeamDeveloper = PersonRef & {
  role: WorkspaceRole | null
}

export type TeamProject = {
  project_id: number
  project_name: string
  scope: 'team' | 'developer'
  user_id: number | null
}

export type WorkspaceTeam = {
  id: number
  name: string
  leader: PersonRef
  manager: PersonRef | null
  developers: TeamDeveloper[]
  projects: TeamProject[]
  can_assign: boolean
}

export type Member = {
  id: number
  name: string
  email: string
  role: WorkspaceRole | null
  reports_to: string | null
  is_self: boolean
  can_delete: boolean
  assignable_roles: WorkspaceRole[]
}

export type MemberDirectory = {
  members: Member[]
  roles: RoleDefinition[]
  creatable_roles: RoleDefinition[]
  actor_role: WorkspaceRole | null
  managers: PersonRef[]
  leaders: PersonRef[]
  teams: WorkspaceTeam[]
  projects: PersonRef[]
  abilities: {
    create: boolean
    assign_project: boolean
  }
}

export type CreateMemberPayload = {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: WorkspaceRole
  team_name?: string
  manager_id?: number
}

export type AssignProjectPayload = {
  project_id: number
  team_id?: number
  user_id?: number
}
