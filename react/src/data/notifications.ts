export type NotificationTone = 'critical' | 'info' | 'success'

export type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  tone: NotificationTone
  unread: boolean
}

export const initialNotifications: AppNotification[] = [
  {
    id: 'spike',
    title: 'Critical error spike',
    body: 'checkout-api crossed 500 errors in the last 15 minutes.',
    time: '2m ago',
    tone: 'critical',
    unread: true,
  },
  {
    id: 'fix',
    title: 'AI fix ready',
    body: 'Suggested patch for GRP-18422 is ready to review.',
    time: '14m ago',
    tone: 'info',
    unread: true,
  },
  {
    id: 'project',
    title: 'Project is live',
    body: 'Demo API is now receiving events for your tenant.',
    time: '1h ago',
    tone: 'success',
    unread: false,
  },
]
