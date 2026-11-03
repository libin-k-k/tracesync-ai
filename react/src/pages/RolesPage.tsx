import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deletePermission,
  deleteRole,
  fetchAccessMe,
  fetchPermissions,
  fetchRoles,
} from '../api/roles'
import { getApiErrorMessage } from '../api/client'
import { IconSearch } from '../components/dashboard/icons'
import { CreatePermissionModal } from '../components/roles/CreatePermissionModal'
import { CreateRoleModal } from '../components/roles/CreateRoleModal'
import { EditRolePermissionsModal } from '../components/roles/EditRolePermissionsModal'
import { EmptyState } from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/ToastProvider'
import type { AccessPayload, AccessPermission, AccessRole } from '../types/role'

type TabKey = 'roles' | 'permissions'

export function RolesPage() {
  const { pushToast } = useToast()
  const [tab, setTab] = useState<TabKey>('roles')
  const [access, setAccess] = useState<AccessPayload | null>(null)
  const [roles, setRoles] = useState<AccessRole[]>([])
  const [permissions, setPermissions] = useState<AccessPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState('')
  const [query, setQuery] = useState('')
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [createPermissionOpen, setCreatePermissionOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null)
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null)
  const [pendingPermissionId, setPendingPermissionId] = useState<number | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setForbidden('')

    try {
      const me = await fetchAccessMe()
      setAccess(me)

      if (!me.abilities.roles_view && !me.abilities.permissions_view) {
        setForbidden('Role management is limited to users with access permissions.')
        setRoles([])
        setPermissions([])
        return
      }

      const [nextRoles, nextPermissions] = await Promise.all([
        me.abilities.roles_view ? fetchRoles() : Promise.resolve([] as AccessRole[]),
        me.abilities.permissions_view
          ? fetchPermissions()
          : Promise.resolve([] as AccessPermission[]),
      ])

      setRoles(nextRoles)
      setPermissions(nextPermissions)
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      const message = getApiErrorMessage(error, 'Unable to load role management.')

      if (status === 403) {
        setForbidden(message)
        return
      }

      pushToast(message, 'danger')
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRoles = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return roles
    }

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(normalized) ||
        (role.description ?? '').toLowerCase().includes(normalized) ||
        role.permissions.some((permission) => permission.name.toLowerCase().includes(normalized))
      )
    })
  }, [roles, query])

  const filteredPermissions = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return permissions
    }

    return permissions.filter((permission) => {
      return (
        permission.name.toLowerCase().includes(normalized) ||
        (permission.group ?? '').toLowerCase().includes(normalized) ||
        (permission.description ?? '').toLowerCase().includes(normalized)
      )
    })
  }, [permissions, query])

  const canManageRoles = access?.abilities.roles_manage === true
  const canManagePermissions = access?.abilities.permissions_manage === true

  const handleDeleteRole = async (role: AccessRole) => {
    if (role.is_system) {
      return
    }

    if (pendingRoleId !== role.id) {
      setPendingRoleId(role.id)
      return
    }

    setBusyKey(`role-${role.id}`)

    try {
      await deleteRole(role.id)
      setRoles((current) => current.filter((item) => item.id !== role.id))
      setPendingRoleId(null)
      pushToast(`${role.name} was deleted.`, 'success')
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to delete that role.'), 'danger')
    } finally {
      setBusyKey(null)
    }
  }

  const handleDeletePermission = async (permission: AccessPermission) => {
    if (permission.is_system) {
      return
    }

    if (pendingPermissionId !== permission.id) {
      setPendingPermissionId(permission.id)
      return
    }

    setBusyKey(`permission-${permission.id}`)

    try {
      await deletePermission(permission.id)
      setPermissions((current) => current.filter((item) => item.id !== permission.id))
      setPendingPermissionId(null)
      pushToast(`${permission.name} was deleted.`, 'success')
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to delete that permission.'), 'danger')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="dash-page anim-fade-in-up">
      <section className="glass-panel projects-panel" aria-labelledby="roles-title">
        <div className="projects-header">
          <div>
            <h2 id="roles-title" className="heading-section">
              Role management
            </h2>
            <p className="text-muted">
              Create custom roles, attach permissions, and keep built-in TraceSync roles protected.
            </p>
          </div>
          <div className="role-header-actions">
            {tab === 'roles' && canManageRoles ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreateRoleOpen(true)}>
                Create role
              </button>
            ) : null}
            {tab === 'permissions' && canManagePermissions ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCreatePermissionOpen(true)}
              >
                Create permission
              </button>
            ) : null}
          </div>
        </div>

        <div className="role-tabs" role="tablist" aria-label="Role management sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'roles'}
            className={tab === 'roles' ? 'role-tab is-active' : 'role-tab'}
            onClick={() => {
              setTab('roles')
              setQuery('')
              setPendingRoleId(null)
            }}
          >
            Roles
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'permissions'}
            className={tab === 'permissions' ? 'role-tab is-active' : 'role-tab'}
            onClick={() => {
              setTab('permissions')
              setQuery('')
              setPendingPermissionId(null)
            }}
          >
            Permissions
          </button>
        </div>

        {loading ? <TableSkeleton rows={4} /> : null}

        {!loading && forbidden ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="Access restricted"
            description={forbidden}
          />
        ) : null}

        {!loading && !forbidden ? (
          <div className="projects-toolbar">
            <label className="search-field search-field-wide">
              <span className="visually-hidden">
                {tab === 'roles' ? 'Search roles' : 'Search permissions'}
              </span>
              <IconSearch className="search-field-icon" />
              <input
                className="search-field-input"
                type="search"
                placeholder={
                  tab === 'roles'
                    ? 'Search roles or permissions...'
                    : 'Search by name, group, or description...'
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <p className="text-muted projects-count">
              {tab === 'roles'
                ? `${filteredRoles.length} of ${roles.length} shown`
                : `${filteredPermissions.length} of ${permissions.length} shown`}
            </p>
          </div>
        ) : null}

        {!loading && !forbidden && tab === 'roles' && filteredRoles.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title={roles.length === 0 ? 'No roles yet' : 'No roles match that search'}
            description={
              roles.length === 0
                ? 'Create a custom role and attach the permissions it should grant.'
                : 'Try another role name or permission.'
            }
            action={
              query ? (
                <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>
                  Clear search
                </button>
              ) : null
            }
          />
        ) : null}

        {!loading && !forbidden && tab === 'roles' && filteredRoles.length > 0 ? (
          <div className="projects-table-wrap">
            <table className="projects-table">
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Permissions</th>
                  <th scope="col">Type</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="projects-name-cell">
                        <span className="projects-name">{role.name}</span>
                      </div>
                      <p className="text-muted member-email">
                        {role.description?.trim() || 'No description'}
                      </p>
                    </td>
                    <td>
                      <div className="role-permission-chips">
                        {role.permissions.length === 0 ? (
                          <span className="text-muted">None</span>
                        ) : (
                          role.permissions.slice(0, 4).map((permission) => (
                            <span key={permission.id} className="status-pill is-inactive">
                              {permission.name}
                            </span>
                          ))
                        )}
                        {role.permissions.length > 4 ? (
                          <span className="text-muted">+{role.permissions.length - 4} more</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={role.is_system ? 'status-pill is-active' : 'status-pill is-inactive'}>
                        {role.is_system ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td>
                      <div className="role-row-actions">
                        {canManageRoles ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-compact"
                            onClick={() => setEditingRole(role)}
                            disabled={busyKey === `role-${role.id}`}
                          >
                            Edit access
                          </button>
                        ) : null}
                        {canManageRoles && !role.is_system ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-compact member-remove"
                            onClick={() => void handleDeleteRole(role)}
                            disabled={busyKey === `role-${role.id}`}
                          >
                            {pendingRoleId === role.id ? 'Confirm delete' : 'Delete'}
                          </button>
                        ) : (
                          <span className="text-muted">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && !forbidden && tab === 'permissions' && filteredPermissions.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title={
              permissions.length === 0 ? 'No permissions yet' : 'No permissions match that search'
            }
            description={
              permissions.length === 0
                ? 'Create a permission in resource.action format, then attach it to roles.'
                : 'Try another permission name or group.'
            }
            action={
              query ? (
                <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>
                  Clear search
                </button>
              ) : null
            }
          />
        ) : null}

        {!loading && !forbidden && tab === 'permissions' && filteredPermissions.length > 0 ? (
          <div className="projects-table-wrap">
            <table className="projects-table">
              <thead>
                <tr>
                  <th scope="col">Permission</th>
                  <th scope="col">Group</th>
                  <th scope="col">Type</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.map((permission) => (
                  <tr key={permission.id}>
                    <td>
                      <div className="projects-name-cell">
                        <span className="projects-name">{permission.name}</span>
                      </div>
                      <p className="text-muted member-email">
                        {permission.description?.trim() || 'No description'}
                      </p>
                    </td>
                    <td>
                      <span className="text-muted">{permission.group ?? 'General'}</span>
                    </td>
                    <td>
                      <span
                        className={
                          permission.is_system ? 'status-pill is-active' : 'status-pill is-inactive'
                        }
                      >
                        {permission.is_system ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td>
                      {canManagePermissions && !permission.is_system ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-compact member-remove"
                          onClick={() => void handleDeletePermission(permission)}
                          disabled={busyKey === `permission-${permission.id}`}
                        >
                          {pendingPermissionId === permission.id ? 'Confirm delete' : 'Delete'}
                        </button>
                      ) : (
                        <span className="text-muted">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <CreateRoleModal
        open={createRoleOpen}
        permissions={permissions}
        onClose={() => setCreateRoleOpen(false)}
        onCreated={(role) => {
          setRoles((current) => [role, ...current.filter((item) => item.id !== role.id)])
          void load()
        }}
      />

      <EditRolePermissionsModal
        open={editingRole !== null}
        role={editingRole}
        permissions={permissions}
        onClose={() => setEditingRole(null)}
        onSaved={(role) => {
          setRoles((current) => current.map((item) => (item.id === role.id ? role : item)))
          setEditingRole(null)
        }}
      />

      <CreatePermissionModal
        open={createPermissionOpen}
        onClose={() => setCreatePermissionOpen(false)}
        onCreated={(permission) => {
          setPermissions((current) => [
            permission,
            ...current.filter((item) => item.id !== permission.id),
          ])
        }}
      />
    </div>
  )
}
