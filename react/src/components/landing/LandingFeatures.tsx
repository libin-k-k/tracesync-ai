import { features } from '../../data/landingContent'

export function LandingFeatures() {
  return (
    <section className="landing-section" id="features" aria-labelledby="features-title">
      <div className="layout-grid">
        <div className="layout-span-12 landing-section-head">
          <p className="landing-eyebrow text-accent">Platform</p>
          <h2 className="heading-section landing-section-title" id="features-title">
            Catch failures fast. Explain them clearly. Ship the patch.
          </h2>
          <p className="text-body landing-section-lead">
            TraceSync separates the SaaS control plane from the high-throughput
            ingest engine so dashboards stay snappy while Redis workers do the
            heavy lifting.
          </p>
        </div>
        <ul className="layout-span-12 landing-feature-list">
          {features.map((feature) => (
            <li key={feature.title} className="landing-feature-row">
              <span className="landing-feature-tag">{feature.tag}</span>
              <div className="landing-feature-copy">
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="text-body">{feature.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
