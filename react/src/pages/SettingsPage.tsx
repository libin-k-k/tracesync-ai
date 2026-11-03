import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProfile } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ui/ToastProvider';
import { FeedSkeleton } from '../components/ui/Skeleton';
import type { AuthTenant, AuthUser } from '../types/auth';

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) {
    return '•'.repeat(apiKey.length);
  }

  return `${apiKey.slice(0, 8)}${'•'.repeat(Math.min(24, apiKey.length - 12))}${apiKey.slice(-4)}`;
}

export function SettingsPage() {
  const { pushToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const profile = await fetchProfile();
        if (!cancelled) {
          setUser(profile.user);
          setTenant(profile.tenant);
        }
      } catch (error) {
        if (!cancelled) {
          pushToast(
            getApiErrorMessage(error, 'Unable to load settings.'),
            'danger',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  const apiKey = tenant?.api_key ?? '';
  const displayKey = useMemo(() => {
    if (!apiKey) {
      return 'Not available';
    }

    return revealed ? apiKey : maskApiKey(apiKey);
  }, [apiKey, revealed]);

  const handleCopy = async () => {
    if (!apiKey) {
      pushToast('No API key available to copy.', 'danger');
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      pushToast('API key copied to clipboard.', 'success');
    } catch {
      pushToast('Unable to copy API key. Check browser permissions.', 'danger');
    }
  };

  return (
    <div className="dash-page anim-fade-in-up">
      <section className="glass-panel settings-panel" aria-labelledby="settings-title">
        <div className="settings-header">
          <div>
            <h2 id="settings-title" className="heading-section">
              Settings
            </h2>
            <p className="text-muted">
              Tenant identity and ingest credentials for NestJS error posts.
            </p>
          </div>
        </div>

        {loading ? <FeedSkeleton /> : null}

        {!loading ? (
          <div className="settings-grid">
            <article className="settings-card">
              <div className="settings-card-head">
                <h3 className="settings-card-title">Account</h3>
                <span className="status-pill is-active">Signed in</span>
              </div>
              <dl className="settings-meta">
                <div>
                  <dt>Name</dt>
                  <dd>{user?.name ?? '-'}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user?.email ?? '-'}</dd>
                </div>
                <div>
                  <dt>Tenant ID</dt>
                  <dd>
                    <code className="mono-chip">
                      {user?.tenant_id ?? tenant?.id ?? '-'}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt>Workspace</dt>
                  <dd>{tenant?.name ?? '-'}</dd>
                </div>
              </dl>
            </article>

            <article className="settings-card settings-card-accent">
              <div className="settings-card-head">
                <h3 className="settings-card-title">Ingest API key</h3>
                <span className="live-feed-badge">Secret</span>
              </div>
              <p className="text-muted settings-help">
                Send this as the <code className="inline-code">x-api-key</code> header on{' '}
                <code className="inline-code">POST /api/v1/errors</code>. The{' '}
                <Link to="/docs">developer tutorial</Link> shows a full request.
              </p>

              <div className="api-key-row">
                <code
                  className={
                    revealed ? 'api-key-value is-revealed' : 'api-key-value is-masked'
                  }
                >
                  {displayKey}
                </code>

                <div className="api-key-actions">
                  <button
                    type="button"
                    className="btn btn-ghost api-key-reveal"
                    onClick={() => setRevealed((value) => !value)}
                    disabled={!apiKey}
                    aria-pressed={revealed}
                    aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
                    title={revealed ? 'Hide API key' : 'Reveal API key'}
                  >
                    {revealed ? (
                      <svg
                        className="api-key-icon"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M2.1 3.51 3.5 2.1l18.4 18.4-1.41 1.41-2.86-2.86A11.7 11.7 0 0 1 12 19.5C6.5 19.5 2.07 16 1 12c.4-1.5 1.4-3.1 2.8-4.5L2.1 3.51ZM12 7a5 5 0 0 1 4.9 6.1l-1.6-1.6A3 3 0 0 0 12 9c-.3 0-.6.05-.88.14L9.5 7.5C10.27 7.18 11.12 7 12 7Zm0-4.5c5.5 0 9.93 3.5 11 7.5-.4 1.5-1.3 3-2.55 4.3l-1.45-1.45c.9-.95 1.55-2 1.9-2.85C19.5 7.9 16 5.5 12 5.5c-1.05 0-2.05.16-3 .46L7.35 4.3A12.4 12.4 0 0 1 12 2.5Zm-3.1 7.05 4.55 4.55A3 3 0 0 1 8.9 9.55Z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="api-key-icon"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M12 5c5.5 0 9.93 3.5 11 7.5-1.07 4-5.5 7.5-11 7.5S2.07 16.5 1 12.5C2.07 8.5 6.5 5 12 5Zm0 2.5C8 7.5 4.5 9.9 3.1 12.5 4.5 15.1 8 17.5 12 17.5s7.5-2.4 8.9-5C19.5 9.9 16 7.5 12 7.5Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                        />
                      </svg>
                    )}
                    <span>{revealed ? 'Hide key' : 'Reveal key'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      void handleCopy();
                    }}
                    disabled={!apiKey}
                  >
                    Copy to clipboard
                  </button>
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}
