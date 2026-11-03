import { Link } from 'react-router-dom'
import { plans } from '../../data/landingContent'

export function LandingPricing() {
  return (
    <section className="landing-section" id="pricing" aria-labelledby="pricing-title">
      <div className="layout-grid">
        <div className="layout-span-12 landing-section-head">
          <p className="landing-eyebrow text-accent">Pricing</p>
          <h2 className="heading-section landing-section-title" id="pricing-title">
            Volume-based plans that grow with your traffic
          </h2>
          <p className="text-body landing-section-lead">
            Start free, then scale event volume and AI enrichment as your fleet grows.
          </p>
        </div>
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`layout-span-4 glass-card landing-plan${plan.featured ? ' landing-plan-featured' : ''}`}
          >
            {plan.featured ? <span className="landing-plan-badge">Most popular</span> : null}
            <h3 className="landing-feature-title">{plan.name}</h3>
            <p className="landing-plan-price">
              {plan.price}
              <span className="text-muted">{plan.period}</span>
            </p>
            <p className="text-body">{plan.blurb}</p>
            <ul className="landing-plan-perks">
              {plan.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
            <Link
              className={`btn ${plan.featured ? 'btn-primary' : 'btn-ghost'} landing-plan-cta`}
              to="/register"
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
