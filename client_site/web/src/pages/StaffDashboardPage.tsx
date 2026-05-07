import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatScheduleDisplay } from '../lib/formatSchedule';
import { StaffPager } from '../components/StaffPager';

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

type ActiveResponse = {
  contracts: Row[];
  total: number;
  page: number;
  pageSize: number;
};

export function StaffDashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setErr(null);
    try {
      const data = await api<ActiveResponse>(
        `/api/staff/contracts/active?page=${p}&pageSize=${PAGE_SIZE}`
      );
      if (data.total > 0 && data.contracts.length === 0) {
        setPage(1);
        return;
      }
      setRows(data.contracts);
      setTotal(data.total);
    } catch {
      setErr('Could not load active contracts');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  return (
    <div className="staff-page">
      <h1>Active contracts</h1>
      <p className="staff-sub">
        Equipment currently out with customers (status: active), sorted by end
        date.
      </p>
      {err && <p className="error-banner">{err}</p>}
      <StaffPager page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      {loading && <p className="staff-empty">Loading…</p>}
      {!loading && !rows.length && !err ? (
        <p className="staff-empty">No active contracts right now.</p>
      ) : null}
      {!loading && rows.length > 0 && (
        <div className="staff-table-wrap">
          <table className="data-table staff-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Customer</th>
                <th>End</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.contract_number}</td>
                  <td>{c.customer_email}</td>
                  <td>{c.scheduled_end ? formatScheduleDisplay(String(c.scheduled_end)) : '—'}</td>
                  <td>${Number(c.grand_total).toFixed(2)}</td>
                  <td>
                    <Link to={`/staff/contracts/${c.id}`} className="staff-link">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
