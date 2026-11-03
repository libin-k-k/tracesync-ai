import { Link } from 'react-router-dom'
import { footerColumns } from '../../data/landingContent'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="layout-grid">
        <div className="layout-span-12 landing-footer-brand">
          <p className="app-brand landing-footer-logo">
            TraceSync <span className="brand-accent">AI</span>
          </p>
          <p className="text-body landing-footer-blurb">
            Enterprise error monitoring, log ingestion, and AI crash alerting for
            B2B engineering teams.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title} className="layout-span-3 landing-footer-col">
            <p className="landing-footer-heading">{column.title}</p>
            <ul className="landing-footer-links">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link to={link.href}>{link.label}</Link>
                  ) : (
                    <a href={link.href}>{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="layout-span-12 landing-footer-bottom">
          <p className="text-muted">
            © {new Date().getFullYear()} TraceSync AI. All rights reserved.
          </p>
          <p className="text-muted">developer.libinkk@gmail.com</p>
        </div>
      </div>
    </footer>
  )
}
