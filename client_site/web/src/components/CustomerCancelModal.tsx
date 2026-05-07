import { useState } from 'react';
import { api } from '../api/client';

type Props = {
  contractId: number;
  /** Hours until scheduled delivery (positive = future) */
  hoursUntilDelivery: number;
  onClose: () => void;
  onDone: () => void;
};

export function CustomerCancelModal({
  contractId,
  hoursUntilDelivery,
  onClose,
  onDone,
}: Props) {
  const within24h = hoursUntilDelivery >= 0 && hoursUntilDelivery < 24;
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      await api<{ ok: boolean }>(`/api/rental-contracts/${contractId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      onDone();
    } catch (e) {
      setErr((e as Error).message || 'Could not cancel.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cust-cancel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--closable"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <button
          type="button"
          className="modal-close-x"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="cust-cancel-title">Cancel reservation</h2>
        {within24h ? (
          <p className="modal-warn modal-warn--deposit">
            <strong>Deposit notice:</strong> Your scheduled delivery is in less than 24 hours. If you cancel now,
            your <strong>deposit is non-refundable</strong> per our policy.
          </p>
        ) : (
          <p className="modal-warn">
            Cancelling more than 24 hours before delivery: your deposit remains eligible for refund per policy
            (processed separately).
          </p>
        )}
        {err && <p className="error-banner">{err}</p>}
        <div className="modal-actions">
          <button type="button" className="staff-topbar__btn" onClick={onClose} disabled={submitting}>
            Keep reservation
          </button>
          <button type="button" className="btn-primary modal-danger" onClick={submit} disabled={submitting}>
            {submitting ? 'Cancelling…' : 'Confirm cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}
