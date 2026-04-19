import { useEffect, useState } from 'react';
import { api } from '../api/client';

type Job = {
  id: number;
  contract_number: string;
  job_type: string;
  job_status: string;
  scheduled_at: string;
  assigned_staff_user_id: number | null;
};

export function OpsJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api<{ jobs: Job[] }>('/api/fulfillment-jobs');
      setJobs(data.jobs);
    } catch {
      setErr('Could not load jobs (ops role required)');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function assign(id: number) {
    await api(`/api/fulfillment-jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ assignSelf: true }),
    });
    load();
  }

  async function setStatus(id: number, job_status: string) {
    await api(`/api/fulfillment-jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ job_status }),
    });
    load();
  }

  return (
    <div className="page-pad">
      <h1>Fulfillment jobs</h1>
      {err && <p className="error-banner">{err}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>Contract</th>
            <th>Type</th>
            <th>Status</th>
            <th>Scheduled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td>{j.contract_number}</td>
              <td>{j.job_type}</td>
              <td>{j.job_status}</td>
              <td>{j.scheduled_at}</td>
              <td className="actions">
                {j.job_status === 'unassigned' && (
                  <button type="button" onClick={() => assign(j.id)}>
                    Assign to me
                  </button>
                )}
                {j.job_status === 'assigned' && (
                  <button type="button" onClick={() => setStatus(j.id, 'in_progress')}>
                    Start
                  </button>
                )}
                {j.job_status === 'in_progress' && (
                  <button type="button" onClick={() => setStatus(j.id, 'completed')}>
                    Complete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
