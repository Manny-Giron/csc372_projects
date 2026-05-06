import { useState } from 'react';
import { api } from '../api/client';

const REASONS = [
  { code: 'customer_request', label: 'Customer requested cancellation' },
  { code: 'inventory', label: 'Inventory / double-booking' },
  { code: 'payment', label: 'Payment not received' },
  { code: 'logistics', label: 'Logistics or weather' },
  { code: 'other', label: 'Other (add comment below)' },
] as const;

type Props = {
  contractId: number;
  onClose: () => void;
  onDone: () => void;
};

export function CancelReservationModal({ contractId, onClose, onDone }: Props) {
  const [reasonCode, setReasonCode] = useState<string>(REASONS[0].code);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      const reasonLabel = REASONS.find((r) => r.code === reasonCode)?.label || reasonCode;
      await api(`/api/staff/contracts/${contractId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reasonCode,
          reason: detail.trim() ? `${reasonLabel} — ${detail}` : reasonLabel,
        }),
      });
      onDone();
    } catch {
      setErr('Could not cancel. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <div className="modal-panel">
        <h2 id="cancel-title">Cancel reservation</h2>
        <p className="modal-warn">
          This will mark the contract cancelled and release reserved equipment
          when applicable.
        </p>
        {err && <p className="error-banner">{err}</p>}
        <label className="modal-field">
          Reason
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="modal-select"
          >
            {REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="modal-field">
          Optional details
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="Internal notes (optional)"
            className="modal-textarea"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="staff-topbar__btn" onClick={onClose} disabled={submitting}>
            Back
          </button>
          <button
            type="button"
            className="btn-primary modal-danger"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
