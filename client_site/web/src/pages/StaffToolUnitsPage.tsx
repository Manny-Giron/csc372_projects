import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { StaffPager } from '../components/StaffPager';

export type ToolUnitRow = {
  id: number;
  tool_id: number;
  asset_tag: string | null;
  serial_number: string | null;
  condition: string;
  operational_status: string;
  status: string;
  home_location: string | null;
  purchase_cost: string | null;
  replacement_cost: string | null;
  acquired_date: string | null;
  notes: string | null;
  tool_name: string;
  tool_slug: string;
  daily_rate: string;
  deposit: string;
  type_name: string;
  category_name: string;
};

const POOL_STATUSES: { value: string; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented (on contract / out)' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'maintenance', label: 'In maintenance / repair' },
  { value: 'retired', label: 'Retired / loss' },
];

const OP_STATUSES: { value: string; label: string }[] = [
  { value: 'in_service', label: 'In service' },
  { value: 'out_of_service', label: 'Out of service' },
  { value: 'retired', label: 'Retired (ops)' },
];

const DEFAULT_POOL = new Set(['available']);
const DEFAULT_OP = new Set(['in_service']);
const PAGE_SIZE = 10;

function formatMoney(n: string | null | undefined) {
  if (n == null || n === '') return '—';
  return `$${Number(n).toFixed(2)}`;
}

function labelPool(s: string) {
  return POOL_STATUSES.find((x) => x.value === s)?.label ?? s;
}
function labelOp(s: string) {
  return OP_STATUSES.find((x) => x.value === s)?.label ?? s;
}
function labelCondition(s: string) {
  return s.replace(/^\w/, (c) => c.toUpperCase());
}

/** Short label for dropdown summary: one option name, or "N selected". */
function filterSummary(sel: Set<string>, options: { value: string; label: string }[]) {
  if (sel.size === 0) return 'None';
  if (sel.size === 1) {
    const v = [...sel][0];
    return options.find((o) => o.value === v)?.label ?? v;
  }
  return `${sel.size} selected`;
}

export function StaffToolUnitsPage() {
  const [rows, setRows] = useState<ToolUnitRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [poolSel, setPoolSel] = useState<Set<string>>(() => new Set(DEFAULT_POOL));
  const [opSel, setOpSel] = useState<Set<string>>(() => new Set(DEFAULT_OP));
  const [page, setPage] = useState(1);

  const filterKey = useMemo(
    () => `${q}|${[...poolSel].sort().join(',')}|${[...opSel].sort().join(',')}`,
    [q, poolSel, opSel]
  );

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ units: ToolUnitRow[] }>('/api/staff/tool-units');
        if (!cancelled) {
          setRows(data.units);
          setErr(null);
        }
      } catch {
        if (!cancelled) setErr('Could not load equipment. Try again (staff session required).');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!poolSel.has(r.status)) return false;
      if (!opSel.has(r.operational_status)) return false;
      if (!needle) return true;
      const hay = [
        r.tool_name,
        r.category_name,
        r.type_name,
        r.asset_tag,
        r.serial_number,
        r.home_location,
        r.notes,
        r.status,
        r.operational_status,
        r.condition,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, poolSel, opSel]);

  const total = visible.length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const safePage = Math.min(page, maxPage);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const paged = visible.slice(sliceStart, sliceStart + PAGE_SIZE);

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  function toggle(which: 'pool' | 'op', value: string, checked: boolean) {
    const set = which === 'pool' ? setPoolSel : setOpSel;
    set((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value);
      else next.delete(value);
      if (next.size === 0) return prev;
      return next;
    });
  }

  function resetFilters() {
    setPoolSel(new Set(DEFAULT_POOL));
    setOpSel(new Set(DEFAULT_OP));
    setQ('');
  }

  const poolSummary = filterSummary(poolSel, POOL_STATUSES);
  const opSummary = filterSummary(opSel, OP_STATUSES);

  return (
    <div className="staff-page staff-inventory">
      <h1>Equipment &amp; unit records</h1>
      <p className="staff-sub">
        Add statuses from the
        dropdowns. Retired/loss: document in unit notes. Rates show list daily + deposit.
      </p>
      {err && <p className="error-banner">{err}</p>}

      <div className="staff-inventory-toolbar staff-inventory-toolbar--compact">
        <div className="staff-inventory-toolbar-row">
          <div className="staff-search-wrap">
            <label htmlFor="unit-search" className="visually-hidden">
              Search
            </label>
            <input
              id="unit-search"
              type="search"
              className="staff-inventory-search"
              placeholder="Filter by name, tag, location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </div>
          <details className="staff-filter-details">
            <summary className="staff-filter-details__summary">Pool: {poolSummary}</summary>
            <div className="staff-filter-details__panel" onClick={(e) => e.stopPropagation()}>
              {POOL_STATUSES.map((o) => (
                <label key={o.value} className="staff-filter-label">
                  <input
                    type="checkbox"
                    checked={poolSel.has(o.value)}
                    onChange={(e) => toggle('pool', o.value, e.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </details>
          <details className="staff-filter-details">
            <summary className="staff-filter-details__summary">Ops: {opSummary}</summary>
            <div className="staff-filter-details__panel" onClick={(e) => e.stopPropagation()}>
              {OP_STATUSES.map((o) => (
                <label key={o.value} className="staff-filter-label">
                  <input
                    type="checkbox"
                    checked={opSel.has(o.value)}
                    onChange={(e) => toggle('op', o.value, e.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </details>
          <button type="button" className="staff-reset-filters" onClick={resetFilters}>
            Reset
          </button>
        </div>
        <div className="staff-toolbar-foot staff-toolbar-foot--inline">
          <span className="staff-count">
            <strong>{total}</strong> match · {rows.length} total
          </span>
        </div>
      </div>

      <StaffPager
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      {!rows.length && !err ? <p className="staff-empty">Loading…</p> : null}
      {rows.length > 0 && !visible.length ? (
        <p className="staff-empty">No units match the current search and filters.</p>
      ) : null}

      {paged.length > 0 && (
        <div className="staff-table-wrap staff-inventory-table-wrap">
          <table className="data-table staff-table staff-inventory-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Category / type</th>
                <th>Asset / serial</th>
                <th>Pool</th>
                <th>Ops</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Daily / dep.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.tool_name}</strong>
                  </td>
                  <td>
                    {r.category_name}
                    <br />
                    <span className="staff-meta">{r.type_name}</span>
                  </td>
                  <td>
                    {r.asset_tag || '—'}
                    <br />
                    <span className="staff-meta">{r.serial_number || '—'}</span>
                  </td>
                  <td>
                    <span className={`staff-pill staff-pill--${r.status}`}>{labelPool(r.status)}</span>
                  </td>
                  <td>
                    <span className="staff-pill staff-pill--op">{labelOp(r.operational_status)}</span>
                  </td>
                  <td>{labelCondition(r.condition)}</td>
                  <td>{r.home_location || '—'}</td>
                  <td>
                    {formatMoney(r.daily_rate)} / {formatMoney(r.deposit)}
                  </td>
                  <td>
                    <Link to={`/staff/units/${r.id}`} className="staff-link">
                      Details
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
