import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatScheduleDisplay } from '../lib/formatSchedule';

type Item = {
  id: number;
  tool_name: string;
  tool_slug: string;
  quantity: number;
  daily_rate_snapshot: string;
  deposit_snapshot: string;
  rental_days: number;
  line_subtotal: string;
  item_status: string;
};

type Contract = {
  id: number;
  contract_number: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  grand_total: string;
  subtotal: string;
  deposit_total: string;
  tax_total: string;
  fees_total: string;
  notes: string | null;
  customer_email: string;
  created_at: string;
};

export function StaffContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [delivery, setDelivery] = useState<Record<string, string | null> | null>(null);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api<{
          contract: Contract;
          items: Item[];
          delivery: Record<string, string | null> | null;
        }>(`/api/staff/contracts/${id}`);
        setContract(data.contract);
        setItems(data.items);
        setDelivery(data.delivery);
        setNotes(data.contract.notes || '');
        setNotesDirty(false);
      } catch {
        setErr('Could not load contract');
      }
    })();
  }, [id]);

  async function saveNotes() {
    if (!id) return;
    setSaving(true);
    setErr(null);
    try {
      await api(`/api/staff/contracts/${id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setNotesDirty(false);
    } catch {
      setErr('Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  if (err && !contract) {
    return (
      <div className="staff-page">
        <p className="error-banner">{err}</p>
        <Link to="/staff/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  if (!contract) {
    return <p className="page-loading">Loading…</p>;
  }

  return (
    <div className="staff-page staff-contract">
      <p className="staff-breadcrumb">
        <Link to="/staff/dashboard">Active contracts</Link>
        {' · '}
        <Link to="/staff/reservations">Reservations</Link>
      </p>
      <h1>Contract {contract.contract_number}</h1>
      <p className="staff-sub">
        Field / check-in view — verify equipment, customer, and times. Add
        internal notes below (saved to the contract record).
      </p>

      <div className="contract-detail-grid">
        <section className="card-panel">
          <h2>Status &amp; schedule</h2>
          <dl className="contract-dl">
            <div>
              <dt>Status</dt>
              <dd>{contract.status}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{contract.customer_email}</dd>
            </div>
            <div>
              <dt>Start</dt>
              <dd>{formatScheduleDisplay(String(contract.scheduled_start))}</dd>
            </div>
            <div>
              <dt>End</dt>
              <dd>{formatScheduleDisplay(String(contract.scheduled_end))}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>${Number(contract.grand_total).toFixed(2)}</dd>
            </div>
          </dl>
        </section>

        {delivery && (
          <section className="card-panel">
            <h2>Delivery / site</h2>
            <p className="address-block">
              {[delivery.line1, delivery.line2, delivery.city, delivery.state_region, delivery.postal_code]
                .filter(Boolean)
                .join(', ')}
            </p>
            {delivery.delivery_instructions && (
              <p>
                <strong>Instructions:</strong> {delivery.delivery_instructions}
              </p>
            )}
            {!delivery.line1 && <p className="fine-print">No address on file (pickup or pending).</p>}
          </section>
        )}

        <section className="card-panel">
          <h2>Line items (tools)</h2>
          <ul className="contract-lines">
            {items.map((it) => (
              <li key={it.id}>
                <strong>{it.tool_name}</strong> ×{it.quantity} — {it.item_status} — $
                {Number(it.line_subtotal).toFixed(2)} / term
                <span className="fine-print">
                  {' '}
                  ({it.rental_days} day(s) @ ${Number(it.daily_rate_snapshot).toFixed(2)}
                  /day)
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-panel">
          <h2>Internal contract notes</h2>
          <p className="fine-print">
            Visible to staff in this portal. (Placeholder for a full comment
            thread in a future version.)
          </p>
          <textarea
            className="contract-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            rows={6}
            placeholder="Condition at pickup, customer requests, handoff notes…"
          />
          <button
            type="button"
            className="btn-primary"
            onClick={saveNotes}
            disabled={!notesDirty || saving}
          >
            {saving ? 'Saving…' : 'Save notes'}
          </button>
          {err && <p className="error-banner">{err}</p>}
        </section>
      </div>
    </div>
  );
}
