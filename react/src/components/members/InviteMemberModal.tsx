import { useState, type FormEvent } from 'react'
import { createMember } from '../../api/members'
import { getApiErrorMessage } from '../../api/client'
import { Dropdown } from '../ui/Dropdown'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/ToastProvider'
import type { Member, PersonRef, RoleDefinition, WorkspaceRole } from '../../types/member'

type InviteMemberModalProps = {
  open: boolean
  roles: RoleDefinition[]
  actorRole: WorkspaceRole | null
  managers: PersonRef[]
  leaders: PersonRef[]
  onClose: () => void
  onCreated: (member: Member) => void
}

export function InviteMemberModal({
  open,
  roles,
  actorRole,
  managers,
  leaders,
  onClose,
  onCreated,
}: InviteMemberModalProps) {
  const { pushToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const defaultRole = roles[0]?.name ?? 'Junior Developer'
  const [role, setRole] = useState<WorkspaceRole>(defaultRole)
  const [teamName, setTeamName] = useState('')
  const [managerId, setManagerId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  if (open && !wasOpen) {
    setWasOpen(true)
    setRole(defaultRole)
    setTeamName('')
    setManagerId('')
  }

  if (!open && wasOpen) {
    setWasOpen(false)
  }

  const needsTeam = role === 'Team Leader'
  const needsManager = role === 'Team Leader' && actorRole !== 'Engineering Manager'
  const needsLeader =
    (role === 'Senior Developer' || role === 'Junior Developer') && actorRole !== 'Team Leader'
  const reportOptions = needsManager ? managers : needsLeader ? leaders : []
  const reportLabel = needsManager ? 'Engineering manager' : 'Team leader'

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmation('')
    setRole(roles[0]?.name ?? 'Junior Developer')
    setTeamName('')
    setManagerId('')
  }

  const handleClose = () => {
    if (submitting) {
      return
    }

    resetForm()
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password !== confirmation) {
      pushToast('Password confirmation does not match.', 'danger')
      return
    }

    if (needsTeam && teamName.trim() === '') {
      pushToast('A team name is required for a team leader.', 'danger')
      return
    }

    if ((needsManager || needsLeader) && managerId === '') {
      pushToast(`Choose the ${reportLabel.toLowerCase()} this person reports to.`, 'danger')
      return
    }

    setSubmitting(true)

    try {
      const member = await createMember({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
        role,
        ...(needsTeam ? { team_name: teamName.trim() } : {}),
        ...(needsManager || needsLeader ? { manager_id: Number(managerId) } : {}),
      })

      onCreated(member)
      pushToast(`${member.name} joined as ${member.role ?? role}.`, 'success')
      resetForm()
      onClose()
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to add that member.'), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Add member"
      description="They sign in with this email and password. Engineering managers add team leaders. Team leaders add senior and junior developers."
      layout="landscape"
      onClose={handleClose}
    >
      <form className="modal-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="field-input"
            type="text"
            name="name"
            required
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Asha Dev"
          />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="field-input"
            type="email"
            name="email"
            required
            maxLength={255}
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="asha@company.com"
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="field-input"
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Confirm password</span>
          <input
            className="field-input"
            type="password"
            name="password_confirmation"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        <div className="field">
          <span className="field-label" id="member-role-label">
            Role
          </span>
          <Dropdown
            labelledBy="member-role-label"
            value={role}
            options={roles.map((item) => ({ value: item.name, label: item.name }))}
            onChange={(next) => {
              setRole(next)
              setManagerId('')
            }}
            disabled={submitting || roles.length === 0}
          />
        </div>
        {needsTeam ? (
          <label className="field">
            <span className="field-label">Team name</span>
            <input
              className="field-input"
              type="text"
              name="team_name"
              required
              maxLength={255}
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Checkout"
            />
          </label>
        ) : null}
        {reportOptions.length > 0 ? (
          <div className="field">
            <span className="field-label" id="member-report-label">
              {reportLabel}
            </span>
            <Dropdown
              labelledBy="member-report-label"
              value={managerId}
              options={[
                { value: '', label: `Select ${reportLabel.toLowerCase()}` },
                ...reportOptions.map((person) => ({ value: String(person.id), label: person.name })),
              ]}
              onChange={setManagerId}
              disabled={submitting}
            />
          </div>
        ) : null}
        {(needsManager && managers.length === 0) || (needsLeader && leaders.length === 0) ? (
          <p className="text-muted modal-form-note">
            {needsManager
              ? 'Add an engineering manager before you add a team leader.'
              : 'Add a team leader with a team before you add developers.'}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || roles.length === 0}>
            {submitting ? 'Adding...' : 'Add member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
