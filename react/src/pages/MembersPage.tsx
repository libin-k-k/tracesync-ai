import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { assignMemberRole, fetchMembers, removeMember } from '../api/members'
import { getApiErrorMessage } from '../api/client'
import { IconSearch } from '../components/dashboard/icons'
import { InviteMemberModal } from '../components/members/InviteMemberModal'
import { TeamBoard } from '../components/members/TeamBoard'
import { Dropdown } from '../components/ui/Dropdown'
import { EmptyState } from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/ToastProvider'
import type { Member, MemberDirectory, WorkspaceRole } from '../types/member'

export function MembersPage() {
  const { pushToast } = useToast()
  const [directory, setDirectory] = useState<MemberDirectory | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState('')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    fetchMembers()
      .then((payload) => {
        if (active) {
          setDirectory(payload)
        }
      })
      .catch((error) => {
        if (!active) {
          return
        }

        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        const message = getApiErrorMessage(error, 'Unable to load members.')

        if (status === 403) {
          setForbidden(message)
          return
        }

        pushToast(message, 'danger')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [pushToast])

  const members = directory?.members ?? []
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return members
    }

    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(normalized) ||
        member.email.toLowerCase().includes(normalized) ||
        (member.role ?? '').toLowerCase().includes(normalized)
      )
    })
  }, [members, query])

  const reload = () => {
    fetchMembers()
      .then(setDirectory)
      .catch((error) => {
        pushToast(getApiErrorMessage(error, 'Unable to load members.'), 'danger')
      })
  }

  const replaceMember = (next: Member) => {
    setDirectory((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        members: current.members.map((member) => (member.id === next.id ? next : member)),
      }
    })
  }

  const handleRole = async (member: Member, role: WorkspaceRole) => {
    if (role === member.role) {
      return
    }

    setBusyId(member.id)

    try {
      const updated = await assignMemberRole(member.id, role)
      replaceMember(updated)
      pushToast(`${updated.name} is now ${role}.`, 'success')
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to change that role.'), 'danger')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (member: Member) => {
    if (pendingId !== member.id) {
      setPendingId(member.id)
      return
    }

    setBusyId(member.id)

    try {
      await removeMember(member.id)
      setDirectory((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          members: current.members.filter((item) => item.id !== member.id),
        }
      })
      setPendingId(null)
      pushToast(`${member.name} was removed from the workspace.`, 'success')
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to remove that member.'), 'danger')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="dash-page anim-fade-in-up">
      <section className="glass-panel projects-panel" aria-labelledby="members-title">
        <div className="projects-header">
          <div>
            <h2 id="members-title" className="heading-section">
              Workspace members
            </h2>
            <p className="text-muted">
              Engineering managers add team leaders. Team leaders add senior and junior developers
              on their team. The workspace Admin sits above that line.
            </p>
          </div>
          {directory?.abilities.create ? (
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
              Add member
            </button>
          ) : null}
        </div>

        {loading ? <TableSkeleton rows={4} /> : null}

        {!loading && forbidden ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="Members are limited to Admins"
            description={forbidden}
          />
        ) : null}

        {!loading && !forbidden && directory ? (
          <ol className="member-roles">
            {directory.roles.map((role) => (
              <li key={role.name}>
                <span className="member-role-name">{role.name}</span>
                <span className="text-muted">{role.description}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {!loading && !forbidden && members.length > 0 ? (
          <div className="projects-toolbar">
            <label className="search-field search-field-wide">
              <span className="visually-hidden">Search members</span>
              <IconSearch className="search-field-icon" />
              <input
                className="search-field-input"
                type="search"
                placeholder="Search by name, email, or role..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <p className="text-muted projects-count">
              {filtered.length} of {members.length} shown
            </p>
          </div>
        ) : null}

        {!loading && !forbidden && members.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="No members yet"
            description="Add someone to this workspace and give them a role."
          />
        ) : null}

        {!loading && !forbidden && members.length > 0 && filtered.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="No members match that search"
            description="Try another name, email, or role."
            action={
              <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>
                Clear search
              </button>
            }
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="projects-table-wrap">
            <table className="projects-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Reports to</th>
                  <th scope="col">Access</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const assignable = member.role
                    ? [member.role, ...member.assignable_roles.filter((role) => role !== member.role)]
                    : member.assignable_roles
                  const options = assignable.length > 0 ? assignable : []

                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="projects-name-cell">
                          <span className="projects-name">{member.name}</span>
                          {member.is_self ? <span className="status-pill is-active">You</span> : null}
                        </div>
                        <p className="text-muted member-email">{member.email}</p>
                      </td>
                      <td>
                        {options.length > 1 ? (
                          <Dropdown
                            variant="chip"
                            ariaLabel={`Role for ${member.name}`}
                            value={member.role ?? options[0]}
                            options={options.map((item) => ({ value: item, label: item }))}
                            onChange={(role) => void handleRole(member, role)}
                            disabled={busyId === member.id}
                          />
                        ) : (
                          <span className="status-pill is-inactive">{member.role ?? 'No role'}</span>
                        )}
                      </td>
                      <td>
                        <span className="text-muted">{member.reports_to ?? 'Workspace'}</span>
                      </td>
                      <td>
                        {member.can_delete ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-compact member-remove"
                            onClick={() => void handleRemove(member)}
                            disabled={busyId === member.id}
                          >
                            {pendingId === member.id ? 'Confirm remove' : 'Remove'}
                          </button>
                        ) : (
                          <span className="text-muted">Protected</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {!loading && !forbidden && directory ? (
        <TeamBoard
          teams={directory.teams}
          projects={directory.projects}
          canAssign={directory.abilities.assign_project}
          onAssigned={reload}
        />
      ) : null}

      <InviteMemberModal
        open={modalOpen}
        roles={directory?.creatable_roles ?? []}
        actorRole={directory?.actor_role ?? null}
        managers={directory?.managers ?? []}
        leaders={directory?.leaders ?? []}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          reload()
        }}
      />
    </div>
  )
}
