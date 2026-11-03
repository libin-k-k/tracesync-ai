import { Link, useLocation } from 'react-router-dom'
import { navLinks } from '../../data/landingContent'

function resolveHref(href: string, pathname: string): string {
  if (href.startsWith('#') && pathname !== '/') {
    return `/${href}`
  }

  return href
}

export function LandingNav() {
  const { pathname } = useLocation()

  return (
    <header className="app-header glass-nav landing-nav anim-fade-in-up">
      <Link className="app-brand landing-brand" to="/">
        <span className="brand-mark brand-mark-sm" aria-hidden="true">
          TS
        </span>
        <span>
          TraceSync <span className="brand-accent">AI</span>
        </span>
      </Link>
      <nav className="landing-nav-links" aria-label="Primary">
        {navLinks.map((link) => {
          const href = resolveHref(link.href, pathname)
          const className =
            href === '/docs' && pathname.startsWith('/docs')
              ? 'landing-nav-link is-active'
              : 'landing-nav-link'

          if (href.startsWith('/')) {
            return (
              <Link key={link.href} className={className} to={href}>
                {link.label}
              </Link>
            )
          }

          return (
            <a key={link.href} className={className} href={href}>
              {link.label}
            </a>
          )
        })}
      </nav>
      <div className="landing-nav-actions">
        <Link className="btn btn-ghost" to="/login">
          Sign in
        </Link>
        <Link className="btn btn-primary" to="/register">
          Start free
        </Link>
      </div>
    </header>
  )
}
