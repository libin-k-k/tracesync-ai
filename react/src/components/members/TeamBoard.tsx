import { useMemo, useState, type FormEvent } from 'react'
import { assignProject } from '../../api/members'
import { getApiErrorMessage } from '../../api/client'
import { Dropdown } from '../ui/Dropdown'
import { useToast } from '../ui/ToastProvider'
import type { PersonRef, WorkspaceTeam } from '../../types/member'

type TeamBoardProps = {
  teams: WorkspaceTeam[]
  projects: PersonRef[]
  canAssign: boolean
  onAssigned: () => void
}

export function TeamBoard({ teams, projects, canAssign, onAssigned }: TeamBoardProps) {
  const { pushToast } = useToast()
  const assignable = useMemo(() => teams.filter((team) => team.can_assign), [teams])
  const [projectId, setProjectId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [target, setTarget] = useState<'team' | 'developer'>('team')
  const [developerId, setDeveloperId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedTeam = assignable.find((team) => String(team.id) === teamId)
  const developers = (selectedTeam?.developers ?? []).filter(
    (person) => person.role === 'Senior Developer' || person.role === 'Junior Developer',
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (projectId === '' || teamId === '') {
      pushToast('Choose a project and a team.', 'danger')
      return
    }

    if (target === 'developer' && developerId === '') {
      pushToast('Choose the developer who should own this project.', 'danger')
      return
    }

    setSubmitting(true)

    try {
      await assignProject({
        project_id: Number(projectId),
        ...(target === 'team' ? { team_id: Number(teamId) } : { user_id: Number(developerId) }),
      })
      pushToast('Project assignment saved.', 'success')
      setProjectId('')
      setDeveloperId('')
      onAssigned()
    } catch (error) {
      pushToast(getApiErrorMessage(error, 'Unable to assign that project.'), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="glass-panel projects-panel" aria-labelledby="teams-title">
      <div className="projects-header">
        <div>
          <h2 id="teams-title" className="heading-section">
            Teams and projects
          </h2>
          <p className="text-muted">
            An engineering manager leads several team leaders. A team leader leads senior and junior
            developers. Assign a project to the whole team or to one developer.
          </p>
        </div>
      </div>

      {canAssign && assignable.length > 0 && projects.length > 0 ? (
        <form className="team-assign" onSubmit={(event) => void handleSubmit(event)}>
          <div className="field">
            <span className="field-label" id="assign-project-label">
              Project
            </span>
            <Dropdown
              labelledBy="assign-project-label"
              value={projectId}
              options={[
                { value: '', label: 'Select project' },
                ...projects.map((project) => ({ value: String(project.id), label: project.name })),
              ]}
              onChange={setProjectId}
              disabled={submitting}
            />
          </div>
          <div className="field">
            <span className="field-label" id="assign-team-label">
              Team
            </span>
            <Dropdown
              labelledBy="assign-team-label"
              value={teamId}
              options={[
                { value: '', label: 'Select team' },
                ...assignable.map((team) => ({ value: String(team.id), label: team.name })),
              ]}
              onChange={(next) => {
                setTeamId(next)
                setDeveloperId('')
              }}
              disabled={submitting}
            />
          </div>
          <div className="field">
            <span className="field-label" id="assign-target-label">
              Assign to
            </span>
            <Dropdown
              labelledBy="assign-target-label"
              value={target}
              options={[
                { value: 'team', label: 'Whole team' },
                { value: 'developer', label: 'One developer' },
              ]}
              onChange={(next) => {
                setTarget(next)
                setDeveloperId('')
              }}
              disabled={submitting}
            />
          </div>
          {target === 'developer' ? (
            <div className="field">
              <span className="field-label" id="assign-developer-label">
                Developer
              </span>
              <Dropdown
                labelledBy="assign-developer-label"
                value={developerId}
                options={[
                  { value: '', label: developers.length === 0 ? 'No developers on this team' : 'Select developer' },
                  ...developers.map((person) => ({
                    value: String(person.id),
                    label: `${person.name} (${person.role ?? 'Developer'})`,
                  })),
                ]}
                onChange={setDeveloperId}
                disabled={submitting || developers.length === 0}
              />
            </div>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Assign project'}
          </button>
        </form>
      ) : null}

      {teams.length === 0 ? (
        <p className="text-muted">No teams yet. Add a team leader to create the first team.</p>
      ) : (
        <ol className="team-grid">
          {teams.map((team) => (
            <li key={team.id} className="team-card">
              <div className="team-card-head">
                <h3 className="team-card-title">{team.name}</h3>
                <span className="status-pill is-inactive">{team.leader.name}</span>
              </div>
              <p className="text-muted team-card-meta">
                {team.manager ? `Engineering manager: ${team.manager.name}` : 'No engineering manager'}
              </p>
              <p className="team-card-label">Developers</p>
              {team.developers.length === 0 ? (
                <p className="text-muted">No senior or junior developers yet.</p>
              ) : (
                <ul className="team-people">
                  {team.developers.map((person) => (
                    <li key={person.id}>
                      <span>{person.name}</span>
                      <span className="text-muted">{person.role ?? 'Developer'}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="team-card-label">Projects</p>
              {team.projects.length === 0 ? (
                <p className="text-muted">No project assigned.</p>
              ) : (
                <ul className="team-people">
                  {team.projects.map((project) => {
                    const owner = team.developers.find((person) => person.id === project.user_id)

                    return (
                      <li key={`${project.project_id}-${project.user_id ?? 'team'}`}>
                        <span>{project.project_name}</span>
                        <span className="text-muted">
                          {project.scope === 'team' ? 'Whole team' : (owner?.name ?? 'One developer')}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
