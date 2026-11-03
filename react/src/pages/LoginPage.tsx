import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginRequest } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await loginRequest({ email, password });
      setSession({ token: data.token, user: data.user });

      const redirectTo =
        (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-glow" />
        <div className="auth-brand-content">
          <span className="app-brand auth-brand-lockup">
            TraceSync <span className="brand-accent">AI</span>
          </span>
          <h2 className="auth-brand-title">Crash noise in. Code fixes out.</h2>
          <p className="auth-brand-copy">
            Sign in to your tenant workspace for live AI-enriched alerts, project control, and
            secure ingest credentials.
          </p>
          <ul className="auth-brand-points">
            <li>High-throughput NestJS ingest</li>
            <li>Async OpenAI / Claude remediation</li>
            <li>Realtime Socket.IO live feed</li>
          </ul>
        </div>
      </aside>

      <div className="auth-page">
        <div className="auth-card glass-panel anim-fade-in-up">
          <Link to="/" className="app-brand auth-brand">
            TraceSync <span className="brand-accent">AI</span>
          </Link>
          <h1 className="heading-section">Sign in</h1>
          <p className="text-muted">Access your tenant dashboard and live crash feed.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="field-input"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="field-input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? (
              <p className="form-alert form-alert-danger" role="alert">
                {error}
              </p>
            ) : null}

            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-muted auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
