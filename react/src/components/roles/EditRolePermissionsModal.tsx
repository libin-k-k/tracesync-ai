import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { syncRolePermissions, updateRole } from '../../api/roles'
import { getApiErrorMessage } from '../../api/client'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/ToastProvider'
import type { AccessPermission, AccessRole } from '../../types/role'

type EditRolePermissionsModalProps = {
  open: boolean
  role: AccessRole | null
  permissions: AccessPermission[]
  onClose: () => void
  onSaved: (role: AccessRole) => void
}

export function EditRolePermissionsModal({
  open,
  role,
  permissions,
  onClose,
  onSaved,
}: EditRolePermissionsModalProps) {
  const { pushToast } = useToast()
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !role) {
      return
    }

    setDescription(role.description ?? '')
    setSelected(role.permissions.map((item) => item.name))
  }, [open, role])

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

  const handleClose = () => {
    if (submitting) {
      return
    }

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

    if (!role) {
      return
    }

    setSubmitting(true)

    try {
      await updateRole(role.id, {
        description: description.trim() || null,
      })
      const updated = await syncRolePermissions(role.id, selected)
      onSaved(updated)
      pushToast(`${updated.name} permissions updated.`, 'success')
      onClose()
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to update that role.'), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open && role !== null}
      title={role ? `Edit ${role.name}` : 'Edit role'}
      description={
        role?.is_system
          ? 'Built-in role. You can adjust permissions, but the name stays locked.'
          : 'Update the description and permission set for this custom role.'
      }
      layout="landscape"
      onClose={handleClose}
    >
      <form className="modal-form role-modal-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label className="field">
          <span className="field-label">Description</span>
          <input
            className="field-input"
            type="text"
            name="description"
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={submitting}
          />
        </label>

        <div className="field role-permission-field">
          <span className="field-label">Permissions</span>
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
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !role}>
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
