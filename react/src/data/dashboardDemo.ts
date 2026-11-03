export const dashboardKpis = [
  {
    id: 'total',
    label: 'Total Errors',
    value: '12,840',
    delta: '+18.4%',
    deltaTone: 'up' as const,
    icon: 'warning' as const,
  },
  {
    id: 'unresolved',
    label: 'Unresolved',
    value: '524',
    delta: '-27.3%',
    deltaTone: 'down' as const,
    icon: 'stack' as const,
  },
  {
    id: 'resolved',
    label: 'Resolved',
    value: '11,892',
    delta: '+22.1%',
    deltaTone: 'good' as const,
    icon: 'check' as const,
  },
  {
    id: 'ai',
    label: 'AI Analyses',
    value: '8,406',
    delta: '94.2% success rate',
    deltaTone: 'neutral' as const,
    icon: 'spark' as const,
  },
] as const

export const volumeSeries = [
  { label: 'Jan 16', value: 920 },
  { label: 'Jan 17', value: 1100 },
  { label: 'Jan 18', value: 980 },
  { label: 'Jan 19', value: 1340 },
  { label: 'Jan 20', value: 1280 },
  { label: 'Jan 21', value: 1520 },
  { label: 'Jan 22', value: 1784 },
  { label: 'Jan 23', value: 1460 },
  { label: 'Jan 24', value: 1320 },
  { label: 'Jan 25', value: 1180 },
  { label: 'Jan 26', value: 1410 },
  { label: 'Jan 27', value: 1250 },
] as const

export const volumeHighlight = {
  index: 6,
  label: 'Jan 22',
  value: 1784,
} as const

export const severityBreakdown = [
  { id: 'critical', label: 'Critical', value: 2140, percent: 16.7, tone: 'critical' as const },
  { id: 'high', label: 'High', value: 3860, percent: 30.1, tone: 'high' as const },
  { id: 'medium', label: 'Medium', value: 4280, percent: 33.3, tone: 'medium' as const },
  { id: 'low', label: 'Low', value: 2560, percent: 19.9, tone: 'low' as const },
] as const

export const recentErrors = [
  {
    id: '1',
    name: 'TypeError: Cannot read properties of undefined',
    path: 'src/components/UserCard.tsx:42',
    project: 'frontend-web',
    count: 1842,
    lastSeen: '2m ago',
    status: 'open' as const,
  },
  {
    id: '2',
    name: 'NullReferenceException in PaymentOrchestrator',
    path: 'services/checkout/PaymentOrchestrator.ts:118',
    project: 'checkout-api',
    count: 964,
    lastSeen: '8m ago',
    status: 'investigating' as const,
  },
  {
    id: '3',
    name: 'Redis timeout while publishing stream',
    path: 'workers/ingest/streamPublisher.ts:67',
    project: 'orders-worker',
    count: 512,
    lastSeen: '14m ago',
    status: 'open' as const,
  },
  {
    id: '4',
    name: 'Unhandled promise rejection in ErrorBoundary',
    path: 'src/App.tsx:29',
    project: 'frontend-web',
    count: 287,
    lastSeen: '31m ago',
    status: 'resolved' as const,
  },
  {
    id: '5',
    name: 'JWT refresh rotated twice within 30s',
    path: 'gateway/auth/refresh.ts:54',
    project: 'auth-gateway',
    count: 143,
    lastSeen: '1h ago',
    status: 'investigating' as const,
  },
] as const

export const aiInsight = {
  title: 'AI Insight',
  issue: 'GRP-18422 · UserCard.tsx',
  rootCause:
    'Optional user profile data is accessed before the query settles, so `user.profile` is undefined on first paint.',
  before: 'const city = user.profile.city;',
  after: 'const city = user?.profile?.city ?? "Unknown";',
  confidence: '0.91',
} as const

export const planUsage = {
  label: 'Pro Plan',
  used: '120,480',
  limit: '500,000',
  percent: 24,
} as const
