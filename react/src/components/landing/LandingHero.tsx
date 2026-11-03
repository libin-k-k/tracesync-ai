import { Link } from 'react-router-dom'
import { feedRows, heroFix } from '../../data/landingContent'

export function LandingHero() {
  return (
    <section className="landing-hero" id="top" aria-labelledby="hero-title">
      <div className="landing-hero-atmosphere" aria-hidden="true">
        <span className="landing-hero-glow landing-hero-glow-a anim-float-soft" />
        <span className="landing-hero-glow landing-hero-glow-b anim-float-soft-delayed" />
        <span className="landing-hero-grid" />
      </div>

      <div className="layout-grid landing-hero-copy-wrap">
        <div className="layout-span-12 landing-hero-copy anim-fade-in-up">
          <p className="landing-brand-mark" id="hero-brand">
            TraceSync <span className="brand-accent">AI</span>
          </p>
          <h1 className="heading-display landing-hero-title" id="hero-title">
            Ship the fix, not just the stack trace
          </h1>
          <p className="text-body landing-hero-lead">
            High-volume error ingest with live alerts and AI-written patches for
            B2B engineering teams.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary anim-pulse-accent" to="/register">
              Start monitoring free
            </Link>
            <a className="btn btn-secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>
      </div>

      <div className="landing-hero-stage anim-fade-in-up-delay-2" aria-label="Product preview">
        <div className="landing-hero-stage-inner">
          <div className="landing-hero-stage-chrome">
            <div className="landing-hero-stage-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="landing-hero-stage-title">Live error feed</p>
            <span className="landing-hero-live">
              <span className="landing-feed-dot anim-pulse-accent" aria-hidden="true" />
              Streaming
            </span>
          </div>

          <div className="landing-hero-stage-body">
            <ul className="landing-feed-list landing-hero-feed">
              {feedRows.slice(0, 5).map((row) => (
                <li key={`${row.service}-${row.time}`} className="landing-feed-row">
                  <span className={`landing-severity landing-severity-${row.severity}`}>
                    {row.severity}
                  </span>
                  <span className="landing-feed-service">{row.service}</span>
                  <span className="landing-feed-message">{row.message}</span>
                  <span className="landing-feed-time text-muted">{row.time}</span>
                </li>
              ))}
            </ul>

            <aside className="landing-hero-fix" aria-label="AI suggested fix">
              <p className="landing-hero-fix-label">AI suggested fix</p>
              <p className="landing-hero-fix-issue">{heroFix.issue}</p>
              <pre className="landing-hero-fix-code">
                <code>{heroFix.snippet}</code>
              </pre>
              <p className="landing-hero-fix-note text-muted">{heroFix.note}</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
