import { logoStrip } from '../../data/landingContent'

export function LandingLogos() {
  return (
    <section className="landing-section landing-section-tight" aria-label="Trusted by teams">
      <div className="layout-grid">
        <div className="layout-span-12">
          <p className="landing-section-kicker text-muted">
            Built for product and platform teams shipping under pressure
          </p>
          <ul className="landing-logo-strip">
            {logoStrip.map((name) => (
              <li key={name} className="landing-logo-item">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
