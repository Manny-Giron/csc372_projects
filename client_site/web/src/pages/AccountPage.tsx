import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isStaffUser } from '../staff/roles';

type Summary = {
  rentalCount: number;
  totalSpent: number;
};

function EditProfileModal({
  initialFirst: f0,
  initialLast: l0,
  initialPhone: p0,
  onClose,
  onSaved,
}: {
  initialFirst: string;
  initialLast: string;
  initialPhone: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(f0);
  const [lastName, setLastName] = useState(l0);
  const [phone, setPhone] = useState(p0);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(f0);
    setLastName(l0);
    setPhone(p0);
  }, [f0, l0, p0]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
        }),
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="modal-panel account-modal">
        <h2 id="edit-profile-title">Edit name &amp; phone</h2>
        {err && <p className="error-banner">{err}</p>}
        <form onSubmit={submit} className="auth-form account-modal-form">
          <label>
            First name
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label>
            Last name
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              maxLength={32}
            />
          </label>
          <div className="modal-actions account-modal-actions">
            <button type="button" className="account-btn account-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmailModal({
  currentEmail,
  onClose,
  onSaved,
}: {
  currentEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const data = await api<{ token: string; user: { id: number; email: string; roles: string[] } }>(
        '/api/account/email',
        {
          method: 'PATCH',
          body: JSON.stringify({ newEmail, currentPassword }),
        }
      );
      setToken(data.token);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-email-title">
      <div className="modal-panel account-modal">
        <h2 id="edit-email-title">Change email</h2>
        <p className="modal-warn">Enter your current password to confirm. Your session will stay signed in.</p>
        {err && <p className="error-banner">{err}</p>}
        <form onSubmit={submit} className="auth-form account-modal-form">
          <label>
            New email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <div className="modal-actions account-modal-actions">
            <button type="button" className="account-btn account-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { user, logout, refreshMe } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Summary>('/api/account/summary');
        setSummary(data);
      } catch {
        setSummaryErr('Could not load spending summary');
      }
    })();
  }, []);

  if (!user) {
    return null;
  }

  const profile = user.profile;
  const first = profile?.first_name ?? '';
  const last = profile?.last_name ?? '';
  const phone = profile?.phone ?? '';
  const canEditProfile = !!profile || user.roles.includes('customer');

  return (
    <div className="page-pad account-page">
      <h1>Account</h1>
      <p>Manage your profile, email, and rental activity.</p>

      <section className="card-panel account-metrics" aria-label="Rental activity">
        <h2>Spending &amp; rentals</h2>
        {summaryErr && <p className="error-banner">{summaryErr}</p>}
        {summary && !summaryErr && (
          <div className="account-metric-row">
            <div className="account-metric">
              <span className="account-metric__label">Total paid (all time)</span>
              <span className="account-metric__value">${summary.totalSpent.toFixed(2)}</span>
              <span className="account-metric__hint">From completed payments on your rental contracts</span>
            </div>
            <div className="account-metric">
              <span className="account-metric__label">Rental count</span>
              <span className="account-metric__value">{summary.rentalCount}</span>
              <span className="account-metric__hint">Contracts that are not draft or cancelled</span>
            </div>
          </div>
        )}
        {!summary && !summaryErr && <p className="page-loading">Loading summary…</p>}
      </section>

      <section className="card-panel account-card">
        <div className="account-card-head">
          <h2>Profile</h2>
          <div className="account-card-actions">
            {canEditProfile && (
              <button type="button" className="account-btn account-btn--sm" onClick={() => setShowProfile(true)}>
                Edit name &amp; phone
              </button>
            )}
            <button type="button" className="account-btn account-btn--sm" onClick={() => setShowEmail(true)}>
              Change email
            </button>
          </div>
        </div>
        {profile ? (
          <>
            <p className="account-line">
              <strong>
                {profile.first_name} {profile.last_name}
              </strong>
            </p>
            {profile.phone && <p className="account-line">Phone: {profile.phone}</p>}
          </>
        ) : (
          <p className="fine-print">
            No customer profile on file. Use <strong>Edit name &amp; phone</strong> if you have a customer
            account, or contact support.
          </p>
        )}
        <p className="account-line">Email: {user.email}</p>
      </section>

      <div className="account-nav-buttons">
        <Link to="/my-rentals" className="account-btn account-btn--primary account-btn--block">
          My rentals
        </Link>
        {isStaffUser(user) && (
          <Link
            to="/staff/dashboard"
            className="account-btn account-btn--staff account-btn--block"
          >
            Staff portal
          </Link>
        )}
      </div>

      <p className="account-logout-row">
        <button type="button" className="account-btn account-btn--ghost" onClick={logout}>
          Log out
        </button>
      </p>

      {showProfile && canEditProfile && (
        <EditProfileModal
          initialFirst={first}
          initialLast={last}
          initialPhone={phone}
          onClose={() => setShowProfile(false)}
          onSaved={() => refreshMe()}
        />
      )}

      {showEmail && (
        <EditEmailModal
          currentEmail={user.email}
          onClose={() => setShowEmail(false)}
          onSaved={() => refreshMe()}
        />
      )}
    </div>
  );
}
