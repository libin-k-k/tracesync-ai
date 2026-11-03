import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProjects } from '../api/projects';
import { getApiErrorMessage } from '../api/client';
import { IconFolder, IconSearch } from '../components/dashboard/icons';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import type { Project } from '../types/project';

export function ProjectsPage() {
  const { pushToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);

    try {
      const items = await fetchProjects();
      setProjects(items);
    } catch (error) {
      pushToast(
        getApiErrorMessage(error, 'Unable to load projects.'),
        'danger',
      );
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreated = (project: Project) => {
    setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalized) ||
        project.framework_type.toLowerCase().includes(normalized) ||
        String(project.id).includes(normalized)
      );
    });
  }, [projects, query]);

  return (
    <div className="dash-page anim-fade-in-up">
      <section className="glass-panel projects-panel" aria-labelledby="projects-title">
        <div className="projects-header">
          <div>
            <h2 id="projects-title" className="heading-section">
              Your projects
            </h2>
            <p className="text-muted">
              Tenant-scoped applications monitored by TraceSync AI.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Create project
          </button>
        </div>

        <div className="projects-toolbar">
          <label className="search-field search-field-wide">
            <span className="visually-hidden">Search projects</span>
            <IconSearch className="search-field-icon" />
            <input
              className="search-field-input"
              type="search"
              placeholder="Search by name, framework, or ID..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loading || projects.length === 0}
            />
          </label>
          <p className="text-muted projects-count">
            {loading ? 'Loading...' : `${filtered.length} of ${projects.length} shown`}
          </p>
        </div>

        {loading ? <TableSkeleton rows={5} /> : null}

        {!loading && projects.length === 0 ? (
          <EmptyState
            icon={<IconFolder />}
            title="No projects yet"
            description="Create your first monitored application to start attributing crashes to a project."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalOpen(true)}
              >
                Create project
              </button>
            }
          />
        ) : null}

        {!loading && projects.length > 0 && filtered.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="No projects match that search"
            description="Clear the filter or try another keyword."
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
                  <th scope="col">Name</th>
                  <th scope="col">Framework</th>
                  <th scope="col">Status</th>
                  <th scope="col">Project ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="projects-name-cell">
                        <span className="projects-name">{project.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="projects-framework">
                        {project.framework_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          project.is_active
                            ? 'status-pill is-active'
                            : 'status-pill is-inactive'
                        }
                      >
                        {project.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td>
                      <code className="mono-chip">{String(project.id)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
