export const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '#faq', label: 'FAQ' },
] as const

export const logoStrip = [
  'Northwind Labs',
  'Orbit Pay',
  'Helix Cloud',
  'Nova Retail',
  'Pulse Health',
  'StackForge',
] as const

export const heroFix = {
  issue: 'GRP-18422 · PaymentOrchestrator.processRefund',
  snippet: `if (!payment?.refundToken) {
  throw new RefundUnavailableError(orderId);
}
await ledger.credit(payment.refundToken);`,
  note: 'Confidence 0.91 · reviewed against last deploy and similar issues',
} as const

export const features = [
  {
    title: 'High-throughput log ingest',
    body: 'Push thousands of structured error events per second into NestJS ingest endpoints backed by Redis - without blocking your customer APIs.',
    tag: 'Ingest',
  },
  {
    title: 'AI crash analysis',
    body: 'LLMs review stack traces, release metadata, and recent deploys to draft root-cause notes and suggested code fixes your team can action.',
    tag: 'AI',
  },
  {
    title: 'Realtime developer feeds',
    body: 'Watch live exception streams over WebSockets in a glass ops dashboard built for triage, assignment, and incident response.',
    tag: 'Realtime',
  },
  {
    title: 'Multi-tenant control plane',
    body: 'Onboard companies, issue project API keys, manage RBAC roles, and meter subscription usage from the Laravel admin plane.',
    tag: 'SaaS',
  },
  {
    title: 'Async queue workers',
    body: 'Emails, webhooks, AI calls, and heavy writes leave the request path. Redis queues keep latency predictable under spike traffic.',
    tag: 'Scale',
  },
  {
    title: 'Billing-ready plans',
    body: 'Tier free, pro, and enterprise log volume with Razorpay subscriptions. Upgrade when your error volume grows - not when your pager does.',
    tag: 'Billing',
  },
] as const

export const steps = [
  {
    step: '01',
    title: 'Install the SDK',
    body: 'Drop a few lines into Laravel, NestJS, React, or any HTTP client. Tag releases, environments, and user context automatically.',
  },
  {
    step: '02',
    title: 'Stream errors async',
    body: 'The ingest engine accepts payloads, validates API keys, and enqueues analysis jobs so your product API stays responsive.',
  },
  {
    step: '03',
    title: 'Review AI-assisted fixes',
    body: 'Open the dashboard, inspect grouped issues, and apply or dismiss LLM-generated patch suggestions with full audit history.',
  },
] as const

export const feedRows = [
  {
    severity: 'critical',
    service: 'checkout-api',
    message: 'NullReferenceException in PaymentOrchestrator.processRefund',
    time: '2s ago',
  },
  {
    severity: 'warning',
    service: 'auth-gateway',
    message: 'JWT refresh rotated twice within 30s for device_id=8f2a',
    time: '9s ago',
  },
  {
    severity: 'info',
    service: 'ingest-worker',
    message: 'AI analysis completed for issue GRP-18422 (confidence 0.91)',
    time: '14s ago',
  },
  {
    severity: 'critical',
    service: 'orders-worker',
    message: 'Redis timeout while publishing stream tracesync:errors',
    time: '21s ago',
  },
  {
    severity: 'warning',
    service: 'frontend-web',
    message: 'Unhandled promise rejection in ErrorBoundary fallback',
    time: '33s ago',
  },
  {
    severity: 'info',
    service: 'billing-hooks',
    message: 'Razorpay webhook subscription.activated for tenant_id=442',
    time: '41s ago',
  },
] as const

export const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    blurb: 'For side projects and early prototypes.',
    cta: 'Start free',
    featured: false,
    perks: [
      '50k events / month',
      '7-day retention',
      '1 project',
      'Email digests',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mo',
    blurb: 'For growing SaaS teams shipping weekly.',
    cta: 'Start Pro trial',
    featured: true,
    perks: [
      '2M events / month',
      '90-day retention',
      'Unlimited projects',
      'AI fix suggestions',
      'Slack + webhook alerts',
      'Razorpay billing portal',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    blurb: 'For regulated and high-volume fleets.',
    cta: 'Talk to sales',
    featured: false,
    perks: [
      'Custom event volume',
      '1-year+ retention',
      'SSO + audit exports',
      'Dedicated ingest region',
      'Priority AI models',
      '24/7 success manager',
    ],
  },
] as const

export const testimonials = [
  {
    quote:
      'We replaced three brittle homegrown scrapers with TraceSync and cut mean time-to-detect by half. The AI notes are surprisingly useful on night deploys.',
    name: 'Priya Nair',
    role: 'Staff Engineer, Orbit Pay',
  },
  {
    quote:
      'Multi-tenant API keys and Razorpay metering meant we could productize observability for our own customers without rebuilding billing.',
    name: 'Marcus Chen',
    role: 'CTO, Helix Cloud',
  },
  {
    quote:
      'The glass dashboard looks premium, but the win is Redis-backed ingest that never stalls our checkout path during flash sales.',
    name: 'Elena Rossi',
    role: 'Platform Lead, Nova Retail',
  },
] as const

export const faqs = [
  {
    q: 'Is TraceSync a Sentry or Datadog replacement?',
    a: 'TraceSync focuses on error monitoring, log ingest, and AI-assisted crash fixes for B2B SaaS teams. You can complement or replace parts of your existing APM stack depending on volume and workflow.',
  },
  {
    q: 'Which stack does the monorepo use?',
    a: 'Laravel powers the control plane, NestJS handles high-speed ingest, and React (Vite) delivers the realtime dashboard. MySQL and Redis sit underneath.',
  },
  {
    q: 'How does AI analysis work?',
    a: 'Error context is queued asynchronously and analyzed with your configured LLM provider. Suggestions are stored against issues so engineers can review, apply, or dismiss them.',
  },
  {
    q: 'Can we run everything locally?',
    a: 'Yes. Docker Compose boots Laravel on 8080, NestJS on 3030, React on 5173, plus MySQL and Redis for a full local sandbox.',
  },
  {
    q: 'How is billing handled?',
    a: 'Subscription tiers map to log volume. Razorpay handles checkout, invoices, and webhooks for upgrades, renewals, and cancellations.',
  },
  {
    q: 'Is multi-tenancy first-class?',
    a: 'Tenants, projects, and nullable super-admin users are modeled in the Laravel modular architecture with strict foreign keys and API key isolation.',
  },
] as const

export const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'API reference', href: '/docs#reference' },
      { label: 'Send an error', href: '/docs#send' },
      { label: 'Local setup', href: '/docs#local' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Customers', href: '#customers' },
      { label: 'Security', href: '#faq' },
      { label: 'Contact', href: '#cta' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
      { label: 'Start free', href: '/register' },
    ],
  },
] as const
