import { Link } from 'react-router-dom'
import type { ErrorAlertPayload } from '../../types/error-alert'

type RecentErrorsTableProps = {
  items: ErrorAlertPayload[]
  loading: boolean
}

function formatSeen(value: string): string {
  if (!value) {
    return 'Just now'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function previewSolution(value: string): string {
  const line = value.replace(/\s+/g, ' ').trim()
  if (line.length <= 96) {
    return line
  }

  return `${line.slice(0, 93)}...`
}

export function RecentErrorsTable({ items, loading }: RecentErrorsTableProps) {
  return (
    <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th scope="col">Error</th>
              <th scope="col">Project</th>
              <th scope="col">Seen</th>
              <th scope="col">AI solution</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  Loading error history...
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No saved errors yet. Ingest a crash and it will appear here.
                </td>
              </tr>
            ) : null}
            {!loading
              ? items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="dash-error-cell">
                        <span className="dash-error-icon dash-error-icon-open" aria-hidden="true" />
                        <div>
                          <p className="dash-error-name">
                            <Link className="dash-error-link" to={`/errors/${row.id}`}>
                              {row.error_message}
                            </Link>
                          </p>
                          <p className="text-muted dash-error-path">Alert #{row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="dash-project-pill">{row.project_id}</span>
                    </td>
                    <td className="text-muted">{formatSeen(row.created_at)}</td>
                    <td className="dash-solution-cell">{previewSolution(row.ai_solution)}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
    </div>
  )
}
