import { useState, type FormEvent } from 'react';
import { createProject } from '../../api/projects';
import { getApiErrorMessage } from '../../api/client';
import { Dropdown } from '../ui/Dropdown';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import {
  FRAMEWORK_OPTIONS,
  type FrameworkType,
  type Project,
} from '../../types/project';

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
};

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const { pushToast } = useToast();
  const [name, setName] = useState('');
  const [frameworkType, setFrameworkType] = useState<FrameworkType>('laravel');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setFrameworkType('laravel');
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      pushToast('Project name is required.', 'danger');
      return;
    }

    setSubmitting(true);

    try {
      const project = await createProject({
        name: trimmedName,
        framework_type: frameworkType,
        is_active: true,
      });

      onCreated(project);
      pushToast(`Project "${project.name}" created.`, 'success');
      resetForm();
      onClose();
    } catch (error) {
      pushToast(
        getApiErrorMessage(error, 'Unable to create project. Please try again.'),
        'danger',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create project"
      description="Register an application for error monitoring under your tenant."
      layout="landscape"
      onClose={handleClose}
    >
      <form className="modal-form" onSubmit={handleSubmit} noValidate>
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
            placeholder="Checkout API"
          />
        </label>

        <div className="field">
          <span className="field-label" id="framework-label">
            Framework type
          </span>
          <Dropdown
            labelledBy="framework-label"
            value={frameworkType}
            options={FRAMEWORK_OPTIONS}
            onChange={setFrameworkType}
            disabled={submitting}
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
