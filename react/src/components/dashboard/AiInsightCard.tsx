import { Link } from 'react-router-dom'
import { aiInsight } from '../../data/dashboardDemo'
import { IconSpark } from './icons'

export function AiInsightCard() {
  return (
    <section className="glass-panel dash-ai-panel" aria-labelledby="ai-insight-title">
      <div className="dash-ai-head">
        <span className="dash-ai-badge" aria-hidden="true">
          <IconSpark className="dash-ai-badge-icon" />
        </span>
        <div>
          <h2 className="dash-panel-title" id="ai-insight-title">
            {aiInsight.title}
          </h2>
          <p className="text-muted dash-panel-subtitle">{aiInsight.issue}</p>
        </div>
      </div>

      <div className="dash-ai-block">
        <p className="dash-ai-label">Root Cause</p>
        <p className="dash-ai-copy">{aiInsight.rootCause}</p>
      </div>

      <div className="dash-ai-block">
        <p className="dash-ai-label">Suggested Fix</p>
        <pre className="dash-ai-code">
          <code>
            <span className="dash-diff-del">- {aiInsight.before}</span>
            {'\n'}
            <span className="dash-diff-add">+ {aiInsight.after}</span>
          </code>
        </pre>
        <p className="text-muted dash-ai-confidence">Confidence {aiInsight.confidence}</p>
      </div>

      <Link className="btn btn-primary dash-ai-cta" to="/dashboard">
        View Full Analysis
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
