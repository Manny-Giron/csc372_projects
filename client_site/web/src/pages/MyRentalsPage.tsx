import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

type Row = {
  id: number;
  contract_number: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  grand_total: string;
  created_at: string;
};

export function MyRentalsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ contracts: Row[] }>('/api/rental-contracts/mine');
        setRows(data.contracts);
      } catch {
        setErr('Could not load rentals');
      }
    })();
  }, []);

  return (
    <div className="page-pad">
      <h1>My rentals</h1>
      {err && <p className="error-banner">{err}</p>}
      {!rows.length && !err ? <p>No rentals yet.</p> : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>Contract</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.contract_number}</td>
              <td>{r.status}</td>
              <td>{r.scheduled_start}</td>
              <td>{r.scheduled_end}</td>
              <td>${Number(r.grand_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/tools">Rent more tools</Link>
    </div>
  );
}
