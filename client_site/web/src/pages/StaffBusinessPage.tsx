import { useEffect, useState } from 'react';
import { api } from '../api/client';

type Summary = {
  contracts: {
    total_contracts: number;
    active_contracts: number;
    scheduled_contracts: number;
  };
  payments: { revenue_paid: string | number };
  latestDailyMetrics: {
    metric_date: string;
    total_revenue: string | number;
    rentals_started_count: number;
    overdue_rentals_count: number;
  } | null;
};

export function StaffBusinessPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api<Summary>('/api/admin/summary');
        setData(d);
      } catch {
        setErr('Could not load business metrics (admin only).');
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="staff-page">
        <p className="error-banner">{err}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="page-loading">Loading…</p>;
  }

  const m = data.latestDailyMetrics;

  return (
    <div className="staff-page">
      <h1>Business &amp; metrics</h1>
      <p className="staff-sub">
        High-level counts and revenue snapshots. Full financial reporting would
        live here in production.
      </p>
      <div className="biz-grid">
        <div className="biz-card card-panel">
          <h3>Contracts</h3>
          <p className="biz-stat">{data.contracts.total_contracts}</p>
          <p className="fine-print">Total in system</p>
        </div>
        <div className="biz-card card-panel">
          <h3>Active</h3>
          <p className="biz-stat">{data.contracts.active_contracts}</p>
          <p className="fine-print">Currently out</p>
        </div>
        <div className="biz-card card-panel">
          <h3>Scheduled</h3>
          <p className="biz-stat">{data.contracts.scheduled_contracts}</p>
          <p className="fine-print">Upcoming starts</p>
        </div>
        <div className="biz-card card-panel">
          <h3>Revenue paid (all time)</h3>
          <p className="biz-stat">
            ${Number(data.payments.revenue_paid || 0).toFixed(2)}
          </p>
          <p className="fine-print">From payments marked paid</p>
        </div>
      </div>
      {m && (
        <section className="card-panel staff-metrics-block">
          <h2>Latest daily rollup</h2>
          <p className="fine-print">Date: {String(m.metric_date).slice(0, 10)}</p>
          <dl className="contract-dl">
            <div>
              <dt>Recorded revenue</dt>
              <dd>${Number(m.total_revenue).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Rentals started</dt>
              <dd>{m.rentals_started_count}</dd>
            </div>
            <div>
              <dt>Overdue rentals</dt>
              <dd>{m.overdue_rentals_count}</dd>
            </div>
          </dl>
        </section>
      )}
      <details className="staff-raw">
        <summary>Raw API payload</summary>
        <pre className="admin-json">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}
