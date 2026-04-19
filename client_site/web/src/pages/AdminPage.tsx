import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function AdminPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api<Record<string, unknown>>('/api/admin/summary');
        setData(d);
      } catch {
        setErr('Admin access only');
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="page-pad">
        <p className="error-banner">{err}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="page-pad">Loading…</p>;
  }

  return (
    <div className="page-pad">
      <h1>Business summary</h1>
      <pre className="admin-json">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
