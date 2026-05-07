import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

const router = Router();
const requireStaff = [requireAuth, requireRole('associate', 'admin')];

function parsePageParams(req) {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize), 10) || 10));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** Active rentals — equipment is out with the customer. */
router.get('/contracts/active', ...requireStaff, async (req, res) => {
  const { page, pageSize, offset } = parsePageParams(req);
  try {
    const pool = getPool();
    const [[countRow]] = await pool.execute(
      `SELECT COUNT(*) AS c
       FROM rental_contracts rc
       WHERE rc.status = 'active'`
    );
    const total = Number(countRow.c);
    // LIMIT/OFFSET as prepared parameters trigger ER_WRONG_ARGUMENTS on some MySQL/MariaDB builds.
    const lim = Math.min(100, Math.max(1, Number(pageSize) | 0));
    const off = Math.max(0, Number(offset) | 0);
    const [rows] = await pool.query(
      `SELECT rc.id, rc.contract_number, rc.status, rc.scheduled_start, rc.scheduled_end,
              rc.grand_total, rc.created_at, u.email AS customer_email
       FROM rental_contracts rc
       JOIN users u ON u.id = rc.customer_user_id
       WHERE rc.status = 'active'
       ORDER BY rc.scheduled_end ASC
       LIMIT ${lim} OFFSET ${off}`
    );
    res.json({ contracts: rows, total, page, pageSize });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load active contracts' });
  }
});

/** Upcoming reservations: nearest start date first. Query: scope=active|all (default active). */
router.get('/reservations', ...requireStaff, async (req, res) => {
  const { page, pageSize, offset } = parsePageParams(req);
  const scope = req.query.scope === 'all' ? 'all' : 'active';
  try {
    const pool = getPool();
    const whereActive = `WHERE rc.status IN ('scheduled', 'confirmed')`;
    const whereAll = '';
    const whereClause = scope === 'active' ? whereActive : whereAll;

    const [[countRow]] = await pool.execute(
      `SELECT COUNT(*) AS c
       FROM rental_contracts rc
       JOIN users u ON u.id = rc.customer_user_id
       ${whereClause}`
    );
    const total = Number(countRow.c);

    const orderSql =
      scope === 'active'
        ? 'ORDER BY rc.scheduled_start ASC'
        : 'ORDER BY rc.created_at DESC';

    const lim = Math.min(100, Math.max(1, Number(pageSize) | 0));
    const off = Math.max(0, Number(offset) | 0);

    const [rows] = await pool.query(
      `SELECT rc.id, rc.contract_number, rc.status, rc.scheduled_start, rc.scheduled_end,
              rc.grand_total, rc.created_at, u.email AS customer_email
       FROM rental_contracts rc
       JOIN users u ON u.id = rc.customer_user_id
       ${whereClause}
       ${orderSql}
       LIMIT ${lim} OFFSET ${off}`
    );
    res.json({ contracts: rows, total, page, pageSize, scope });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load reservations' });
  }
});

router.get('/contracts/:id', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const pool = getPool();
  try {
    const [contracts] = await pool.execute(
      `SELECT rc.*, u.email AS customer_email
       FROM rental_contracts rc
       JOIN users u ON u.id = rc.customer_user_id
       WHERE rc.id = ?`,
      [id]
    );
    const c = contracts[0];
    if (!c) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const [items] = await pool.execute(
      `SELECT rci.id, rci.tool_id, rci.tool_unit_id, rci.quantity, rci.daily_rate_snapshot,
              rci.deposit_snapshot, rci.rental_days, rci.line_subtotal, rci.item_status,
              t.name AS tool_name, t.slug AS tool_slug
       FROM rental_contract_items rci
       JOIN tools t ON t.id = rci.tool_id
       WHERE rci.rental_contract_id = ?`,
      [id]
    );
    let delivery = null;
    if (c.delivery_address_id) {
      const [addr] = await pool.execute(
        `SELECT label, line1, line2, city, state_region, postal_code, delivery_instructions
         FROM customer_addresses WHERE id = ?`,
        [c.delivery_address_id]
      );
      delivery = addr[0] || null;
    }
    res.json({ contract: c, items, delivery });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contract' });
  }
});

router.patch('/contracts/:id/notes', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { notes } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (typeof notes !== 'string' || notes.length > 20000) {
    return res.status(400).json({ error: 'notes must be a string' });
  }
  try {
    const pool = getPool();
    const [r] = await pool.execute(
      `UPDATE rental_contracts SET notes = ? WHERE id = ?`,
      [notes, id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

router.post('/contracts/:id/cancel', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { reason, reasonCode } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const line =
    `Cancelled by staff (${req.user.email})` +
    (reasonCode ? ` [${reasonCode}]` : '') +
    (reason ? `: ${reason}` : '');
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id, status, notes FROM rental_contracts WHERE id = ? FOR UPDATE`,
      [id]
    );
    const c = rows[0];
    if (!c) {
      await conn.rollback();
      return res.status(404).json({ error: 'Contract not found' });
    }
    if (!['scheduled', 'confirmed'].includes(c.status)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ error: 'Only scheduled or confirmed reservations can be cancelled here' });
    }
    const newNotes = c.notes ? `${c.notes}\n\n${line}` : line;
    await conn.execute(
      `UPDATE rental_contracts SET status = 'cancelled', notes = ? WHERE id = ?`,
      [newNotes, id]
    );
    const [itemRows] = await conn.execute(
      `SELECT id, tool_unit_id FROM rental_contract_items WHERE rental_contract_id = ?`,
      [id]
    );
    for (const it of itemRows) {
      await conn.execute(
        `UPDATE rental_contract_items SET item_status = 'cancelled' WHERE id = ?`,
        [it.id]
      );
      if (it.tool_unit_id) {
        await conn.execute(
          `UPDATE tool_units SET status = 'available' WHERE id = ? AND status = 'reserved'`,
          [it.tool_unit_id]
        );
      }
    }
    await conn.execute(
      `UPDATE contract_fulfillment_jobs
       SET job_status = 'cancelled'
       WHERE rental_contract_id = ? AND job_status IN ('unassigned', 'assigned')`,
      [id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Failed to cancel contract' });
  } finally {
    conn.release();
  }
});

/** All inventory units (catalog + location + pool status) — ops / Home Depot style grid. */
router.get('/tool-units', ...requireStaff, async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT
         tu.id, tu.tool_id, tu.asset_tag, tu.serial_number, tu.\`condition\`, tu.operational_status, tu.status,
         tu.home_location, tu.purchase_cost, tu.replacement_cost, tu.acquired_date, tu.notes, tu.created_at, tu.updated_at,
         t.name AS tool_name, t.slug AS tool_slug, t.daily_rate, t.deposit, t.delivery_only,
         tt.name AS type_name, tc.name AS category_name
       FROM tool_units tu
       JOIN tools t ON t.id = tu.tool_id
       JOIN tool_types tt ON tt.id = t.type_id
       JOIN tool_categories tc ON tc.id = tt.category_id
       ORDER BY t.name ASC, tu.asset_tag ASC`
    );
    res.json({ units: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load tool units' });
  }
});

/** Single unit + open maintenance (if any) + repair history. */
router.get('/tool-units/:id', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const pool = getPool();
  try {
    const [units] = await pool.execute(
      `SELECT
         tu.id, tu.tool_id, tu.asset_tag, tu.serial_number, tu.\`condition\`, tu.operational_status, tu.status,
         tu.home_location, tu.purchase_cost, tu.replacement_cost, tu.acquired_date, tu.notes, tu.created_at, tu.updated_at,
         t.name AS tool_name, t.slug AS tool_slug, t.daily_rate, t.deposit, t.delivery_only,
         tt.name AS type_name, tc.name AS category_name
       FROM tool_units tu
       JOIN tools t ON t.id = tu.tool_id
       JOIN tool_types tt ON tt.id = t.type_id
       JOIN tool_categories tc ON tc.id = tt.category_id
       WHERE tu.id = ?`,
      [id]
    );
    const unit = units[0];
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    const [maintenance] = await pool.execute(
      `SELECT m.id, m.tool_unit_id, m.event_type, m.summary, m.detail, m.cost, m.started_at, m.completed_at,
              m.performed_by_user_id, m.created_at, m.updated_at, u.email AS performed_by_email
       FROM maintenance_events m
       LEFT JOIN users u ON u.id = m.performed_by_user_id
       WHERE m.tool_unit_id = ?
       ORDER BY m.created_at DESC`,
      [id]
    );
    res.json({ unit, maintenance: maintenance || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load unit' });
  }
});

/** Put equipment down for repair: maintenance event + status change + history. */
router.post('/tool-units/:id/repair', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { summary, detail, cost } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (typeof summary !== 'string' || !summary.trim()) {
    return res.status(400).json({ error: 'summary is required' });
  }
  const costNum = cost != null && cost !== '' ? Number(cost) : null;
  if (cost != null && cost !== '' && (Number.isNaN(costNum) || costNum < 0)) {
    return res.status(400).json({ error: 'cost must be a non-negative number' });
  }
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id, status, operational_status FROM tool_units WHERE id = ? FOR UPDATE`,
      [id]
    );
    const u = rows[0];
    if (!u) {
      await conn.rollback();
      return res.status(404).json({ error: 'Unit not found' });
    }
    const [openM] = await conn.execute(
      `SELECT id FROM maintenance_events WHERE tool_unit_id = ? AND completed_at IS NULL LIMIT 1`,
      [id]
    );
    if (openM[0]) {
      await conn.rollback();
      return res.status(400).json({ error: 'This unit already has an open work order. Complete it first or add notes to that ticket.' });
    }
    const startedAt = new Date();
    const [ins] = await conn.execute(
      `INSERT INTO maintenance_events
       (tool_unit_id, event_type, summary, detail, cost, started_at, performed_by_user_id)
       VALUES (?, 'repair', ?, ?, ?, ?, ?)`,
      [id, summary.trim(), detail && String(detail).trim() ? String(detail) : null, costNum, startedAt, req.user.id]
    );
    const fromStatus = u.status;
    const fromOp = u.operational_status;
    await conn.execute(
      `UPDATE tool_units SET status = 'maintenance', operational_status = 'out_of_service' WHERE id = ?`,
      [id]
    );
    await conn.execute(
      `INSERT INTO tool_unit_status_history
       (tool_unit_id, from_status, to_status, from_operational_status, to_operational_status, reason, changed_by_user_id)
       VALUES (?, ?, 'maintenance', ?, 'out_of_service', ?, ?)`,
      [id, fromStatus, fromOp, `Repair: ${summary.trim().slice(0, 200)}`, req.user.id]
    );
    await conn.commit();
    res.json({ ok: true, maintenanceEventId: ins.insertId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Failed to open repair' });
  } finally {
    conn.release();
  }
});

/** Mark repair complete: release unit back to available / in service when possible. */
router.post('/maintenance/:eventId/complete', ...requireStaff, async (req, res) => {
  const eventId = Number(req.params.eventId);
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' });
  }
  const { detail } = req.body || {};
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [evRows] = await conn.execute(
      `SELECT m.id, m.tool_unit_id, m.completed_at
       FROM maintenance_events m
       WHERE m.id = ? FOR UPDATE`,
      [eventId]
    );
    const ev = evRows[0];
    if (!ev) {
      await conn.rollback();
      return res.status(404).json({ error: 'Maintenance event not found' });
    }
    if (ev.completed_at) {
      await conn.rollback();
      return res.status(400).json({ error: 'This work order is already completed' });
    }
    const unitId = ev.tool_unit_id;
    const [urows] = await conn.execute(
      `SELECT id, status, operational_status FROM tool_units WHERE id = ? FOR UPDATE`,
      [unitId]
    );
    const u = urows[0];
    if (!u) {
      await conn.rollback();
      return res.status(404).json({ error: 'Unit missing' });
    }
    const completed = new Date();
    const extra =
      detail && String(detail).trim()
        ? `\n\n--- Completed ${completed.toISOString()}: ${String(detail).trim()}`
        : '';
    await conn.execute(
      `UPDATE maintenance_events SET completed_at = ?, detail = CONCAT(COALESCE(detail, ''), ?) WHERE id = ?`,
      [completed, extra, eventId]
    );
    const fromStatus = u.status;
    const fromOp = u.operational_status;
    await conn.execute(
      `UPDATE tool_units
       SET status = 'available', operational_status = 'in_service'
       WHERE id = ?`,
      [unitId]
    );
    await conn.execute(
      `INSERT INTO tool_unit_status_history
       (tool_unit_id, from_status, to_status, from_operational_status, to_operational_status, reason, changed_by_user_id)
       VALUES (?, ?, 'available', ?, 'in_service', ?, ?)`,
      [unitId, fromStatus, fromOp, 'Repair work order completed; returned to floor', req.user.id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'Failed to complete repair' });
  } finally {
    conn.release();
  }
});

/** Internal notes on the physical asset. */
router.patch('/tool-units/:id/notes', ...requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { notes } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (typeof notes !== 'string' || notes.length > 20000) {
    return res.status(400).json({ error: 'notes must be a string' });
  }
  try {
    const pool = getPool();
    const [r] = await pool.execute(`UPDATE tool_units SET notes = ? WHERE id = ?`, [notes, id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

export default router;
