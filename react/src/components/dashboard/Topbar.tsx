import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../ui/Avatar'
import { Dropdown } from '../ui/Dropdown'
import { IconCalendar } from './icons'
import { NotificationMenu } from './NotificationMenu'

const rangeOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const

type TopbarProps = {
  title: string
  subtitle?: string
  crumb?: string
}

function greetingForNow(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const isOverview = title === 'Overview'

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const displayName = user?.name ?? 'Karthik'
  const firstName = displayName.split(' ')[0]
  const [range, setRange] = useState<(typeof rangeOptions)[number]['value']>('7d')

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-copy">
        {isOverview ? (
          <>
            <h1 className="dash-page-title">
              {greetingForNow()}, {firstName}
            </h1>
            <p className="dash-page-subtitle">
              Here is what needs attention across your monitored apps.
            </p>
          </>
        ) : (
          <>
            <h1 className="dash-page-title">{title}</h1>
            {subtitle ? <p className="dash-page-subtitle">{subtitle}</p> : null}
          </>
        )}
      </div>

      <div className="dash-topbar-meta">
        <Dropdown
          variant="chip"
          align="end"
          ariaLabel="Time range"
          leading={<IconCalendar />}
          value={range}
          options={rangeOptions}
          onChange={setRange}
        />

        <NotificationMenu />

        <button
          type="button"
          className="dash-user-chip"
          onClick={handleLogout}
          title="Sign out"
        >
          <Avatar name={displayName} size="md" />
          <div className="dash-user-copy">
            <span className="dash-user-name">{displayName}</span>
            <span className="text-muted dash-user-email">{user?.email ?? 'Sign out'}</span>
          </div>
        </button>
      </div>
    </header>
  )
}
