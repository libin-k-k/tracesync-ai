import { Link, NavLink } from 'react-router-dom'
import { planUsage } from '../../data/dashboardDemo'
import {
  IconDocs,
  IconLiveFeed,
  IconMembers,
  IconOverview,
  IconProjects,
  IconRoles,
  IconSettings,
  IconChevron,
} from './icons'

const links = [
  { to: '/dashboard', label: 'Overview', end: true, icon: IconOverview },
  { to: '/errors', label: 'Errors', end: false, icon: IconLiveFeed },
  { to: '/projects', label: 'Projects', end: false, icon: IconProjects },
  { to: '/users', label: 'Members', end: false, icon: IconMembers },
  { to: '/roles', label: 'Roles', end: false, icon: IconRoles },
  { to: '/settings', label: 'Settings', end: false, icon: IconSettings },
  { to: '/docs', label: 'Docs', end: true, icon: IconDocs },
] as const

export function Sidebar() {
  return (
    <aside className="dash-sidebar" aria-label="Primary">
      <div className="dash-sidebar-top">
        <button type="button" className="dash-org-switcher" aria-label="Switch organization">
          <span className="dash-org-mark" aria-hidden="true">
            AL
          </span>
          <span className="dash-org-copy">
            <span className="dash-org-name">Acme Labs</span>
            <span className="text-muted dash-org-plan">Workspace</span>
          </span>
          <IconChevron className="dash-org-chevron" />
        </button>

        <p className="dash-nav-label">Monitor</p>
        <nav className="dash-sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? 'dash-nav-link is-active' : 'dash-nav-link'
                }
              >
                <Icon />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="dash-sidebar-footer">
        <div className="dash-plan-card glass">
          <div className="dash-plan-head">
            <p className="dash-plan-label">{planUsage.label}</p>
            <Link className="dash-plan-link" to="/settings">
              Manage Plan
            </Link>
          </div>
          <div
            className="dash-plan-meter"
            role="progressbar"
            aria-valuenow={planUsage.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Event usage"
          >
            <span className="dash-plan-meter-fill dash-plan-meter-fill-24" />
          </div>
          <p className="text-muted dash-plan-usage">
            {planUsage.used} / {planUsage.limit} events
          </p>
        </div>
      </div>
    </aside>
  )
}
