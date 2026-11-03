import { useMemo, useState, type FormEvent } from 'react'
import { createRole } from '../../api/roles'
import { getApiErrorMessage } from '../../api/client'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/ToastProvider'
import type { AccessPermission, AccessRole } from '../../types/role'

type CreateRoleModalProps = {
  open: boolean
  permissions: AccessPermission[]
  onClose: () => void
  onCreated: (role: AccessRole) => void
}

export function CreateRoleModal({ open, permissions, onClose, onCreated }: CreateRoleModalProps) {
  const { pushToast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, AccessPermission[]>()

    for (const permission of permissions) {
      const group = permission.group?.trim() || 'General'
      const list = map.get(group) ?? []
      list.push(permission)
      map.set(group, list)
    }

    return Array.from(map.entries())
  }, [permissions])

  const resetForm = () => {
    setName('')
    setDescription('')
    setSelected([])
  }

  const handleClose = () => {
    if (submitting) {
      return
    }

    resetForm()
    onClose()
  }

  const togglePermission = (permissionName: string) => {
    setSelected((current) =>
      current.includes(permissionName)
        ? current.filter((item) => item !== permissionName)
        : [...current, permissionName],
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = name.trim()

    if (trimmed === '') {
      pushToast('Role name is required.', 'danger')
      return
    }

    setSubmitting(true)

    try {
      const role = await createRole({
        name: trimmed,
        description: description.trim() || null,
        permissions: selected,
      })
      onCreated(role)
      pushToast(`${role.name} was created.`, 'success')
      resetForm()
      onClose()
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to create that role.'), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Create role"
      description="Custom roles can hold any permission set. Built-in TraceSync roles stay protected."
      layout="landscape"
      onClose={handleClose}
    >
      <form className="modal-form role-modal-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="field-input"
            type="text"
            name="name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="QA Lead"
          />
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <input
            className="field-input"
            type="text"
            name="description"
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Reviews production incidents"
          />
        </label>

        <div className="field role-permission-field">
          <span className="field-label">Permissions</span>
          {grouped.length === 0 ? (
            <p className="text-muted">No permissions available yet.</p>
          ) : (
            <div className="role-permission-groups">
              {grouped.map(([group, items]) => (
                <fieldset key={group} className="role-permission-group">
                  <legend>{group}</legend>
                  <ul className="role-permission-list">
                    {items.map((permission) => {
                      const checked = selected.includes(permission.name)

                      return (
                        <li key={permission.id}>
                          <label className="role-permission-option">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(permission.name)}
                              disabled={submitting}
                            />
                            <span>{permission.name}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create role'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
