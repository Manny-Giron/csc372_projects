import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatScheduleDisplay } from '../lib/formatSchedule';
import { StaffPager } from '../components/StaffPager';
import { CancelReservationModal } from './CancelReservationModal';

const PAGE_SIZE = 10;

type Row = {
  id: number;
  contract_number: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  grand_total: string;
  customer_email: string;
};

type ResResponse = {
  contracts: Row[];
  total: number;
  page: number;
  pageSize: number;
  scope?: string;
};

type Scope = 'active' | 'all';

export function StaffReservationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<Scope>('active');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const load = useCallback(async (p: number, sc: Scope) => {
    setLoading(true);
    setErr(null);
    try {
      const data = await api<ResResponse>(
        `/api/staff/reservations?page=${p}&pageSize=${PAGE_SIZE}&scope=${sc}`
      );
      if (data.total > 0 && data.contracts.length === 0) {
        setPage(1);
        return;
      }
      setRows(data.contracts);
      setTotal(data.total);
    } catch {
      setErr('Could not load reservations');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [scope]);

  useEffect(() => {
    load(page, scope);
  }, [load, page, scope]);

  return (
    <div className="staff-page staff-reservations-page">
      <h1>Reservations</h1>
      <p className="staff-sub">
        Active view shows upcoming scheduled and confirmed bookings. “All reservations” includes completed,
        cancelled, and every status for history.
      </p>

      <div className="staff-res-scope-bar">
        <label htmlFor="res-scope" className="staff-res-scope-label">
          View
        </label>
        <select
          id="res-scope"
          className="staff-res-scope-select"
          value={scope}
          onChange={(e) => setScope(e.target.value as Scope)}
        >
          <option value="active">Active &amp; upcoming (scheduled / confirmed)</option>
          <option value="all">All reservations (history)</option>
        </select>
      </div>

      {err && <p className="error-banner">{err}</p>}
      <StaffPager page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      {loading && <p className="staff-empty">Loading…</p>}
      {!loading && !rows.length && !err ? (
        <p className="staff-empty">
          {scope === 'active' ? 'No upcoming reservations.' : 'No reservations on file.'}
        </p>
      ) : null}
      {!loading && rows.length > 0 && (
        <div className="staff-table-wrap">
          <table className="data-table staff-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Customer</th>
                <th>Starts</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.contract_number}</td>
                  <td>{c.customer_email}</td>
                  <td>
                    {c.scheduled_start ? formatScheduleDisplay(String(c.scheduled_start)) : '—'}
                  </td>
                  <td>
                    <span className={`staff-res-status staff-res-status--${c.status}`}>{c.status}</span>
                  </td>
                  <td>
                    <Link to={`/staff/contracts/${c.id}`} className="staff-link">
                      Details
                    </Link>
                    {scope === 'active' && ['scheduled', 'confirmed'].includes(c.status) && (
                      <>
                        {' · '}
                        <button
                          type="button"
                          className="staff-link-bare"
                          onClick={() => setCancelId(c.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cancelId != null && (
        <CancelReservationModal
          contractId={cancelId}
          onClose={() => setCancelId(null)}
          onDone={() => {
            setCancelId(null);
            load(page, scope);
          }}
        />
      )}
    </div>
  );
}
