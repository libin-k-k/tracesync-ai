import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await registerRequest({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        tenant_name: tenantName.trim() || undefined,
      });

      setSession({ token: data.token, user: data.user });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Unable to register. Please review your details.'),
      );
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
          <h2 className="auth-brand-title">Stand up a tenant in minutes.</h2>
          <p className="auth-brand-copy">
            We provision your workspace and Admin role automatically so you can create projects and
            start ingesting errors immediately.
          </p>
          <ul className="auth-brand-points">
            <li>Modular Laravel control plane</li>
            <li>RBAC-ready multi-tenant access</li>
            <li>API key synced to Redis for ingest</li>
          </ul>
        </div>
      </aside>

      <div className="auth-page">
        <div className="auth-card glass-panel anim-fade-in-up">
          <Link to="/" className="app-brand auth-brand">
            TraceSync <span className="brand-accent">AI</span>
          </Link>
          <h1 className="heading-section">Create account</h1>
          <p className="text-muted">
            We provision a tenant workspace and Admin role automatically.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="field-label">Full name</span>
              <input
                className="field-input"
                type="text"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Work email</span>
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
              <span className="field-label">Company / tenant name</span>
              <input
                className="field-input"
                type="text"
                name="tenant_name"
                autoComplete="organization"
                placeholder="Optional"
                value={tenantName}
                onChange={(event) => setTenantName(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="field-input"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Confirm password</span>
              <input
                className="field-input"
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </label>

            {error ? (
              <p className="form-alert form-alert-danger" role="alert">
                {error}
              </p>
            ) : null}

            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creating workspace...' : 'Create account'}
            </button>
          </form>

          <p className="text-muted auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
