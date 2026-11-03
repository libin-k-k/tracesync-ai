import { useState, type FormEvent } from 'react'
import { createPermission } from '../../api/roles'
import { getApiErrorMessage } from '../../api/client'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/ToastProvider'
import type { AccessPermission } from '../../types/role'

type CreatePermissionModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (permission: AccessPermission) => void
}

export function CreatePermissionModal({ open, onClose, onCreated }: CreatePermissionModalProps) {
  const { pushToast } = useToast()
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setGroup('')
    setDescription('')
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

    const trimmed = name.trim().toLowerCase()

    if (!/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(trimmed)) {
      pushToast('Use resource.action format, for example reports.export.', 'danger')
      return
    }

    setSubmitting(true)

    try {
      const permission = await createPermission({
        name: trimmed,
        group: group.trim() || null,
        description: description.trim() || null,
      })
      onCreated(permission)
      pushToast(`${permission.name} was created.`, 'success')
      resetForm()
      onClose()
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to create that permission.'), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Create permission"
      description="Names must use resource.action. Attach them to roles after you create them."
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
            maxLength={150}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="reports.export"
          />
        </label>
        <label className="field">
          <span className="field-label">Group</span>
          <input
            className="field-input"
            type="text"
            name="group"
            maxLength={100}
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            placeholder="Reports"
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
            placeholder="Export analytics"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create permission'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
