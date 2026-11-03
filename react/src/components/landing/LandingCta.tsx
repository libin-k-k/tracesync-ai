import { Link } from 'react-router-dom'

export function LandingCta() {
  return (
    <section className="landing-section" id="cta" aria-labelledby="cta-title">
      <div className="layout-grid">
        <div className="layout-span-12 landing-cta anim-fade-in-up">
          <p className="landing-eyebrow text-accent">Get started</p>
          <h2 className="heading-section landing-section-title" id="cta-title">
            Stand up TraceSync and ship your first AI-assisted alert today
          </h2>
          <p className="text-body landing-section-lead">
            Create a workspace, generate an API key, and point your staging app at
            the ingest endpoint.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">
              Create free account
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
