import { steps } from '../../data/landingContent'

export function LandingHowItWorks() {
  return (
    <section
      className="landing-section"
      id="how-it-works"
      aria-labelledby="how-title"
    >
      <div className="layout-grid">
        <div className="layout-span-12 landing-section-head">
          <p className="landing-eyebrow text-accent">Workflow</p>
          <h2 className="heading-section landing-section-title" id="how-title">
            From SDK install to AI-assisted resolution
          </h2>
          <p className="text-body landing-section-lead">
            Three steps from first crash to a reviewable fix in your dashboard.
          </p>
        </div>
        <ol className="layout-span-12 landing-steps">
          {steps.map((item) => (
            <li key={item.step} className="landing-step">
              <p className="landing-step-number">{item.step}</p>
              <h3 className="landing-feature-title">{item.title}</h3>
              <p className="text-body">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
