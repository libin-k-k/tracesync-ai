import { useEffect, useMemo, useState } from 'react'
import { fetchErrorHistory } from '../api/errorLogs'
import { IconSearch } from '../components/dashboard/icons'
import { RecentErrorsTable } from '../components/dashboard/RecentErrorsTable'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuthStore } from '../stores/authStore'
import type { ErrorAlertPayload } from '../types/error-alert'

export function ErrorHistoryPage() {
  const tenantId = useAuthStore((state) => state.tenantId)
  const [items, setItems] = useState<ErrorAlertPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!tenantId) {
      setItems([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetchErrorHistory(tenantId)
      .then((rows) => {
        if (active) {
          setItems(rows)
        }
      })
      .catch(() => {
        if (active) {
          setItems([])
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [tenantId])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return items
    }

    return items.filter((item) => {
      return (
        item.error_message.toLowerCase().includes(normalized) ||
        item.project_id.toLowerCase().includes(normalized) ||
        item.ai_solution.toLowerCase().includes(normalized)
      )
    })
  }, [items, query])

  return (
    <div className="dash-page anim-fade-in-up">
      <section className="glass-panel projects-panel">
        <div className="projects-header">
          <div>
            <h2 className="heading-section">Saved errors</h2>
            <p className="text-muted">
              Crashes stored for this workspace, with the AI solution from ingest.
            </p>
          </div>
          <p className="text-muted projects-count">
            {loading ? 'Loading...' : `${filtered.length} of ${items.length} shown`}
          </p>
        </div>

        <div className="projects-toolbar">
          <label className="search-field search-field-wide">
            <span className="visually-hidden">Search error history</span>
            <IconSearch className="search-field-icon" />
            <input
              className="search-field-input"
              type="search"
              placeholder="Search by message, project, or solution..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={loading || items.length === 0}
            />
          </label>
        </div>

        {!loading && items.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="No saved errors yet"
            description="Ingest a crash through the API and it will show up in this history."
          />
        ) : null}

        {!loading && items.length > 0 && filtered.length === 0 ? (
          <EmptyState
            icon={<IconSearch className="empty-icon" />}
            title="No errors match that search"
            description="Try another keyword or clear the filter."
            action={
              <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>
                Clear search
              </button>
            }
          />
        ) : null}

        {loading || filtered.length > 0 ? (
          <RecentErrorsTable items={filtered} loading={loading} />
        ) : null}
      </section>
    </div>
  )
}
