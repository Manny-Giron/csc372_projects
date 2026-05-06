import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CustomerCancelModal } from '../components/CustomerCancelModal';
import { formatScheduleDisplay } from '../lib/formatSchedule';

type Row = {
  id: number;
  contract_number: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  grand_total: string;
  created_at: string;
};

function parseScheduleDate(raw: string): Date {
  const s = String(raw).trim();
  if (!s) return new Date(NaN);
  const normalized = s.includes('T') ? s : s.replace(/^(\d{4}-\d{2}-\d{2})[\s](.+)$/, '$1T$2');
  return new Date(normalized);
}

function isDeliveryStillFuture(scheduledStart: string): boolean {
  const d = parseScheduleDate(scheduledStart);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now() - 90 * 1000;
}

function hoursUntilDelivery(scheduledStart: string): number {
  const d = parseScheduleDate(scheduledStart);
  if (Number.isNaN(d.getTime())) return -Infinity;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function MyRentalsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api<{ contracts: Row[] }>('/api/rental-contracts/mine');
      setRows(data.contracts);
      setErr(null);
    } catch {
      setErr('Could not load rentals');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cancelRow = cancelId != null ? rows.find((r) => r.id === cancelId) : null;
  const cancelHours =
    cancelRow?.scheduled_start != null ? hoursUntilDelivery(cancelRow.scheduled_start) : 0;

  return (
    <div className="page-pad my-rentals-page">
      <h1>My rentals</h1>
      {err && <p className="error-banner">{err}</p>}
      {!rows.length && !err ? <p>No rentals yet.</p> : null}
      {rows.length > 0 && (
        <div className="my-rentals-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const statusNorm = String(r.status || '').trim().toLowerCase();
                const canTryCancel = ['scheduled', 'confirmed'].includes(statusNorm);
                const h = hoursUntilDelivery(r.scheduled_start);
                const deliveryFuture = isDeliveryStillFuture(r.scheduled_start);
                const showLateWarning =
                  canTryCancel && deliveryFuture && h >= 0 && h < 24;
                return (
                  <tr key={r.id}>
                    <td>{r.contract_number}</td>
                    <td>{r.status}</td>
                    <td>{formatScheduleDisplay(r.scheduled_start)}</td>
                    <td>{formatScheduleDisplay(r.scheduled_end)}</td>
                    <td>${Number(r.grand_total).toFixed(2)}</td>
                    <td>
                      {canTryCancel && deliveryFuture ? (
                        <>
                          {showLateWarning && (
                            <span className="cancel-inline-warn" title="Inside 24h window">
                              Deposit risk
                            </span>
                          )}
                          <button
                            type="button"
                            className="btn-link-cancel"
                            onClick={() => setCancelId(r.id)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="my-rentals-cta">
        <Link className="btn btn-rent-more" to="/tools">
          Rent more tools
        </Link>
      </div>

      {cancelId != null &&
        cancelRow &&
        cancelRow.scheduled_start &&
        isDeliveryStillFuture(cancelRow.scheduled_start) && (
          <CustomerCancelModal
            contractId={cancelId}
            hoursUntilDelivery={cancelHours}
            onClose={() => setCancelId(null)}
            onDone={() => {
              setCancelId(null);
              load();
            }}
          />
        )}
    </div>
  );
}
