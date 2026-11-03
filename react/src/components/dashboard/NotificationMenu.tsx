import { useEffect, useId, useRef, useState } from 'react'
import { initialNotifications, type AppNotification } from '../../data/notifications'
import { IconBell } from './icons'

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>(initialNotifications)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const unreadCount = items.filter((item) => item.unread).length

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, unread: false })))
  }

  const markRead = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    )
  }

  return (
    <div ref={rootRef} className={`notify${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="dash-icon-btn"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <IconBell />
        {unreadCount > 0 ? <span className="dash-icon-btn-dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <section className="notify-panel" id={panelId} role="dialog" aria-label="Notifications">
          <header className="notify-head">
            <div className="notify-heading">
              <h2 className="notify-title">Notifications</h2>
              {unreadCount > 0 ? (
                <span className="notify-count">{unreadCount} new</span>
              ) : null}
            </div>
            <button
              type="button"
              className="notify-mark"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </header>
          <ul className="notify-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.unread ? 'notify-item is-unread' : 'notify-item'}
                  onClick={() => markRead(item.id)}
                >
                  <span className={`notify-tone notify-tone-${item.tone}`} aria-hidden="true" />
                  <span className="notify-copy">
                    <span className="notify-item-row">
                      <span className="notify-item-title">{item.title}</span>
                      <span className="notify-item-time">{item.time}</span>
                    </span>
                    <span className="notify-item-body">{item.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
