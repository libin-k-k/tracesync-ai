import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchErrorDetail } from '../api/errorLogs'
import { IconSpark } from '../components/dashboard/icons'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuthStore } from '../stores/authStore'
import type { ErrorAlertPayload } from '../types/error-alert'

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

export function ErrorDetailPage() {
  const { id } = useParams()
  const tenantId = useAuthStore((state) => state.tenantId)
  const [item, setItem] = useState<ErrorAlertPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !id) {
      setItem(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetchErrorDetail(tenantId, id)
      .then((row) => {
        if (active) {
          setItem(row)
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
  }, [id, tenantId])

  if (loading) {
    return (
      <div className="dash-page anim-fade-in-up">
        <p className="text-muted">Loading error details...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="dash-page anim-fade-in-up">
        <EmptyState
          icon={<IconSpark />}
          title="Error not found"
          description="This alert is not in the current workspace history."
          action={
            <Link className="btn btn-primary" to="/errors">
              Back to history
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="dash-page anim-fade-in-up">
      <Link className="error-detail-back" to="/errors">
        Back to error history
      </Link>

      <article className="glass-panel error-detail">
        <header className="error-detail-head">
          <p className="text-muted">Alert #{item.id}</p>
          <h2 className="error-detail-title">{item.error_message}</h2>
          <div className="error-detail-meta">
            <span className="dash-project-pill">Project {item.project_id}</span>
            <time className="text-muted" dateTime={item.created_at}>
              {formatSeen(item.created_at)}
            </time>
          </div>
        </header>

        <section className="live-feed-solution" aria-labelledby="stack-title">
          <h3 id="stack-title" className="live-feed-solution-label">
            Stack trace
          </h3>
          <pre className="live-feed-solution-body">{item.stack_trace || 'No stack trace stored.'}</pre>
        </section>

        <section className="live-feed-solution" aria-labelledby="solution-title">
          <h3 id="solution-title" className="live-feed-solution-label">
            <IconSpark className="live-feed-solution-icon" />
            <span className="text-accent">AI solution</span>
          </h3>
          <pre className="live-feed-solution-body">{item.ai_solution}</pre>
        </section>
      </article>
    </div>
  )
}
