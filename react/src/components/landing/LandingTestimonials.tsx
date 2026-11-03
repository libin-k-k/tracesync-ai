import { testimonials } from '../../data/landingContent'

export function LandingTestimonials() {
  return (
    <section
      className="landing-section"
      id="customers"
      aria-labelledby="customers-title"
    >
      <div className="layout-grid">
        <div className="layout-span-12 landing-section-head">
          <p className="landing-eyebrow text-accent">Customers</p>
          <h2 className="heading-section landing-section-title" id="customers-title">
            Trusted when production cannot wait
          </h2>
          <p className="text-body landing-section-lead">
            Platform leads and staff engineers use TraceSync to shorten the path
            from crash to fix.
          </p>
        </div>
        {testimonials.map((item) => (
          <blockquote key={item.name} className="layout-span-4 landing-quote">
            <p className="landing-quote-text">{item.quote}</p>
            <footer className="landing-quote-meta">
              <cite className="landing-quote-name">{item.name}</cite>
              <span className="text-muted">{item.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
