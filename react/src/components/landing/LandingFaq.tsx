import { faqs } from '../../data/landingContent'

export function LandingFaq() {
  return (
    <section className="landing-section" id="faq" aria-labelledby="faq-title">
      <div className="layout-grid">
        <div className="layout-span-12 landing-section-head">
          <p className="landing-eyebrow text-accent">FAQ</p>
          <h2 className="heading-section landing-section-title" id="faq-title">
            Answers for founders, SREs, and platform teams
          </h2>
        </div>
        <div className="layout-span-12 landing-faq-list">
          {faqs.map((item) => (
            <details key={item.q} className="landing-faq-item">
              <summary className="landing-faq-summary">{item.q}</summary>
              <p className="text-body landing-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
