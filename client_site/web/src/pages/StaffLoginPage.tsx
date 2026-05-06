import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffUser } from '../staff/roles';

export function StaffLoginPage() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from =
    (loc.state as { from?: string } | null)?.from && (loc.state as { from: string }).from !== '/'
      ? (loc.state as { from: string }).from
      : '/staff/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user && isStaffUser(user)) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
    } catch {
      setErr('Invalid email or password');
    }
  }

  if (user && !isStaffUser(user)) {
    return (
      <div className="staff-login-page">
        <div className="staff-login-card">
          <h1>Staff portal</h1>
          <p className="error-banner">
            This account does not have staff access. Use the{' '}
            <Link to="/">main site</Link> to shop and manage your rentals, or
            sign in with a staff account.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              logout();
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (user && isStaffUser(user)) {
    return <p className="page-loading">Redirecting…</p>;
  }

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h1>Staff &amp; admin login</h1>
        <p>
          Sign in to manage contracts, reservations, and operations. Customer
          accounts use the <Link to="/login">public login</Link>.
        </p>
        {err && <p className="error-banner">{err}</p>}
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>
        <p className="staff-login-foot">
          <Link to="/">← Main website</Link>
        </p>
      </div>
    </div>
  );
}
