import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatScheduleDisplay } from '../lib/formatSchedule';
import type { ToolUnitRow } from './StaffToolUnitsPage';

type MaintRow = {
  id: number;
  event_type: string;
  summary: string;
  detail: string | null;
  cost: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  performed_by_email: string | null;
};

function formatMoney(n: string | null | undefined) {
  if (n == null || n === '') return '—';
  return `$${Number(n).toFixed(2)}`;
}

export function StaffToolUnitDetailPage() {
  const { unitId } = useParams();
  const id = Number(unitId);
  const [unit, setUnit] = useState<ToolUnitRow | null>(null);
  const [maintenance, setMaintenance] = useState<MaintRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'err'>('loading');

  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');
  const [cost, setCost] = useState('');
  const [repairErr, setRepairErr] = useState<string | null>(null);
  const [submittingRepair, setSubmittingRepair] = useState(false);

  const [completeDetail, setCompleteDetail] = useState<Record<number, string>>({});
  const [completingId, setCompletingId] = useState<number | null>(null);

  async function load() {
    if (!id) {
      setLoadState('err');
      setErr('Invalid unit id');
      return;
    }
    setLoadState('loading');
    setErr(null);
    try {
      const data = await api<{ unit: ToolUnitRow; maintenance: MaintRow[] }>(`/api/staff/tool-units/${id}`);
      setUnit(data.unit);
      setNotesDraft(data.unit.notes || '');
      setMaintenance(data.maintenance || []);
      setLoadState('ok');
    } catch (e) {
      setLoadState('err');
      setErr((e as Error).message || 'Failed to load');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openOrder = maintenance.find((m) => !m.completed_at);

  async function saveNotes() {
    if (!id) return;
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await api(`/api/staff/tool-units/${id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: notesDraft }),
      });
      setNotesSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSavingNotes(false);
    }
  }

  async function sendToRepair() {
    if (!id) return;
    setRepairErr(null);
    if (!summary.trim()) {
      setRepairErr('Enter a short reason / summary (what is wrong).');
      return;
    }
    setSubmittingRepair(true);
    try {
      await api(`/api/staff/tool-units/${id}/repair`, {
        method: 'POST',
        body: JSON.stringify({
          summary: summary.trim(),
          detail: detail.trim() || undefined,
          cost: cost.trim() || undefined,
        }),
      });
      setSummary('');
      setDetail('');
      setCost('');
      await load();
    } catch (e) {
      setRepairErr((e as Error).message);
    } finally {
      setSubmittingRepair(false);
    }
  }

  async function completeRepair(eventId: number) {
    setRepairErr(null);
    setCompletingId(eventId);
    try {
      await api(`/api/staff/maintenance/${eventId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          detail: completeDetail[eventId]?.trim() || undefined,
        }),
      });
      setCompleteDetail((c) => ({ ...c, [eventId]: '' }));
      await load();
    } catch (e) {
      setRepairErr((e as Error).message);
    } finally {
      setCompletingId(null);
    }
  }

  if (loadState === 'loading' && !unit) {
    return (
      <div className="staff-page">
        <p className="staff-empty">Loading unit…</p>
      </div>
    );
  }

  if (loadState === 'err' && !unit) {
    return (
      <div className="staff-page">
        <p className="error-banner">{err}</p>
        <Link to="/staff/units" className="staff-link">
          ← Back to unit list
        </Link>
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div className="staff-page staff-unit-detail">
      <nav className="staff-breadcrumb">
        <Link to="/staff/units">Equipment &amp; units</Link> / {unit.tool_name} / {unit.asset_tag || `Unit #${unit.id}`}
      </nav>
      {err && <p className="error-banner">{err}</p>}

      <header className="staff-unit-hero">
        <h1>{unit.tool_name}</h1>
        <p className="staff-sub">
          Physical unit record — set out-of-service, track repairs, and keep floor notes. Similar to a Home Depot
          Pro rental asset card.
        </p>
        <a className="staff-link" href={`/tools/item/${unit.tool_slug}`} target="_blank" rel="noreferrer">
          Open public catalog page
        </a>
      </header>

      <div className="unit-detail-panels">
        <section className="staff-panel">
          <h2>Unit facts</h2>
          <dl className="contract-dl">
            <div>
              <dt>Asset tag</dt>
              <dd>{unit.asset_tag || '—'}</dd>
            </div>
            <div>
              <dt>Serial</dt>
              <dd>{unit.serial_number || '—'}</dd>
            </div>
            <div>
              <dt>Pool status</dt>
              <dd>
                <span className={`staff-pill staff-pill--${unit.status}`}>{unit.status.replace(/_/g, ' ')}</span>
              </dd>
            </div>
            <div>
              <dt>Operational</dt>
              <dd>
                <span className="staff-pill staff-pill--op">
                  {unit.operational_status.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
            <div>
              <dt>Condition grade</dt>
              <dd>{unit.condition}</dd>
            </div>
            <div>
              <dt>Home location</dt>
              <dd>{unit.home_location || '—'}</dd>
            </div>
            <div>
              <dt>Rates (list)</dt>
              <dd>
                Daily {formatMoney(unit.daily_rate)} · Deposit {formatMoney(unit.deposit)}
              </dd>
            </div>
            <div>
              <dt>Acquired</dt>
              <dd>{unit.acquired_date ? String(unit.acquired_date).slice(0, 10) : '—'}</dd>
            </div>
            <div>
              <dt>Purchase / replacement (book)</dt>
              <dd>
                {formatMoney(unit.purchase_cost)} / {formatMoney(unit.replacement_cost)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="staff-panel">
          <h2>Internal notes (asset file)</h2>
          <p className="staff-panel-hint">Visible to staff only. Use for loss/theft context, key codes, or PM notes.</p>
          <textarea
            className="contract-notes"
            rows={5}
            value={notesDraft}
            onChange={(e) => {
              setNotesDraft(e.target.value);
              setNotesSaved(false);
            }}
            placeholder="e.g. Stolen 4/1 — police report #…"
          />
          <div className="staff-row-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? 'Saving…' : 'Save notes'}
            </button>
            {notesSaved && <span className="staff-ok">Saved</span>}
          </div>
        </section>
      </div>

      <section className="staff-panel staff-panel--wide">
        <h2>Repair &amp; maintenance</h2>
        {unit.status === 'rented' && (
          <p className="notice inline-notice" role="note">
            This unit is marked <strong>rented</strong> (likely out on a contract). Only send to repair if it
            is physically in the yard; otherwise update the contract first.
          </p>
        )}

        {openOrder && (
          <p className="staff-repair-open">
            Open work order: <strong>{openOrder.summary}</strong> (started{' '}
            {openOrder.started_at ? formatScheduleDisplay(String(openOrder.started_at)) : '—'}
            ) — set as out of service until you complete the repair.
          </p>
        )}

        {!openOrder && (
          <div className="staff-repair-form">
            <h3>Send to repair</h3>
            {repairErr && <p className="error-banner">{repairErr}</p>}
            <div className="form-grid">
              <div className="form-field full">
                <label htmlFor="rep-sum">Summary (required)</label>
                <input
                  id="rep-sum"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Motor seized — estimate pending"
                />
              </div>
              <div className="form-field full">
                <label htmlFor="rep-det">Details</label>
                <textarea
                  id="rep-det"
                  rows={3}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="What the tech should know"
                />
              </div>
              <div className="form-field">
                <label htmlFor="rep-cost">Est. cost (optional)</label>
                <input
                  id="rep-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={sendToRepair}
              disabled={submittingRepair}
            >
              {submittingRepair ? 'Submitting…' : 'Put out of service & start repair ticket'}
            </button>
          </div>
        )}

        <h3>History</h3>
        {!maintenance.length ? (
          <p className="staff-empty">No maintenance events on file.</p>
        ) : (
          <div className="staff-table-wrap">
            <table className="data-table staff-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Summary</th>
                  <th>Detail</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td>{formatScheduleDisplay(String(m.created_at))}</td>
                    <td>{m.event_type}</td>
                    <td>{m.summary}</td>
                    <td className="staff-cell-clip">
                      {m.detail ? m.detail.slice(0, 120) : '—'}
                      {m.detail && m.detail.length > 120 ? '…' : ''}
                    </td>
                    <td>{formatMoney(m.cost)}</td>
                    <td>
                      {m.completed_at ? (
                        <span className="staff-ok">Done {String(m.completed_at).slice(0, 10)}</span>
                      ) : (
                        <span className="staff-warn">Open</span>
                      )}
                    </td>
                    <td>
                      {!m.completed_at && (
                        <div className="staff-complete-cell">
                          <input
                            type="text"
                            className="staff-complete-input"
                            placeholder="Completion note (optional)"
                            value={completeDetail[m.id] || ''}
                            onChange={(e) =>
                              setCompleteDetail((c) => ({ ...c, [m.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => completeRepair(m.id)}
                            disabled={completingId === m.id}
                          >
                            {completingId === m.id ? '…' : 'Return to floor'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
