import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

function toSqlDatetime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error('BAD_DATE');
  }
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const DELIVERY_FEE = 15.0;
const TAX_RATE = 0.0825;

function generateContractNumber() {
  const y = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 89999);
  return `RR-${y}-${n}`;
}

router.post('/', requireAuth, async (req, res) => {
  const {
    scheduledStart,
    scheduledEnd,
    rentalDays,
    fulfillmentMode,
    address,
    items,
    processPaymentStub,
  } = req.body || {};

  if (!scheduledStart || !scheduledEnd || !rentalDays || !fulfillmentMode || !items?.length) {
    return res.status(400).json({
      error: 'scheduledStart, scheduledEnd, rentalDays, fulfillmentMode, items required',
    });
  }
  if (!['delivery', 'pickup'].includes(fulfillmentMode)) {
    return res.status(400).json({ error: 'fulfillmentMode must be delivery or pickup' });
  }
  if (fulfillmentMode === 'delivery' && (!address?.line1 || !address?.city)) {
    return res.status(400).json({ error: 'address required for delivery' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const customerId = req.user.id;

    let deliveryAddressId = null;
    let billingAddressId = null;

    if (address?.line1) {
      const [addrResult] = await conn.execute(
        `INSERT INTO customer_addresses
         (user_id, label, line1, line2, city, state_region, postal_code, country_code, is_default, delivery_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'US', 0, ?)`,
        [
          customerId,
          address.label || 'Delivery',
          address.line1,
          address.line2 || null,
          address.city,
          address.state_region || null,
          address.postal_code || null,
          address.delivery_instructions || null,
        ]
      );
      deliveryAddressId = addrResult.insertId;
      billingAddressId = addrResult.insertId;
    }

    let subtotal = 0;
    let depositTotal = 0;
    const lines = [];

    for (const line of items) {
      const toolId = Number(line.toolId);
      const quantity = Number(line.quantity);
      if (!toolId || !quantity || quantity < 1) {
        throw new Error('INVALID_LINE');
      }

      const [tools] = await conn.execute(
        `SELECT id, daily_rate, deposit, name FROM tools WHERE id = ? AND is_active = 1 FOR UPDATE`,
        [toolId]
      );
      const tool = tools[0];
      if (!tool) throw new Error('UNKNOWN_TOOL');

      const [avail] = await conn.execute(
        `SELECT COUNT(*) AS c FROM tool_units
         WHERE tool_id = ? AND status = 'available' AND operational_status = 'in_service'`,
        [toolId]
      );
      if (avail[0].c < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const daily = Number(tool.daily_rate);
      const dep = Number(tool.deposit);
      const lineSub = daily * rentalDays * quantity;
      subtotal += lineSub;
      depositTotal += dep * quantity;

      lines.push({
        toolId,
        quantity,
        daily_rate: daily,
        deposit_snapshot: dep,
        per_unit_subtotal: daily * rentalDays,
      });
    }

    const feesTotal = fulfillmentMode === 'delivery' ? DELIVERY_FEE : 0;
    const taxable = subtotal + feesTotal;
    const taxTotal = Math.round(taxable * TAX_RATE * 100) / 100;
    const grandTotal = Math.round((subtotal + feesTotal + taxTotal) * 100) / 100;

    const startSql = toSqlDatetime(scheduledStart);
    const endSql = toSqlDatetime(scheduledEnd);

    let contractId;
    let contractNumber;
    for (let attempt = 0; attempt < 8; attempt++) {
      contractNumber = generateContractNumber();
      try {
        const [ins] = await conn.execute(
          `INSERT INTO rental_contracts
           (contract_number, customer_user_id, billing_address_id, delivery_address_id, status,
            scheduled_start, scheduled_end, subtotal, deposit_total, tax_total, fees_total,
            discount_total, grand_total, currency_code, terms_accepted_at)
           VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, 0, ?, 'USD', NOW())`,
          [
            contractNumber,
            customerId,
            billingAddressId,
            deliveryAddressId,
            startSql,
            endSql,
            subtotal,
            depositTotal,
            taxTotal,
            feesTotal,
            grandTotal,
          ]
        );
        contractId = ins.insertId;
        break;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }
    if (!contractId) {
      throw new Error('CONTRACT_NUMBER_COLLISION');
    }

    const fulfillmentJobIds = [];

    for (const line of lines) {
      for (let q = 0; q < line.quantity; q++) {
        const [units] = await conn.execute(
          `SELECT id FROM tool_units
           WHERE tool_id = ? AND status = 'available' AND operational_status = 'in_service'
           LIMIT 1 FOR UPDATE`,
          [line.toolId]
        );
        const unitId = units[0]?.id;
        if (!unitId) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        await conn.execute(
          `INSERT INTO rental_contract_items
           (rental_contract_id, tool_id, tool_unit_id, quantity, daily_rate_snapshot, deposit_snapshot,
            rental_days, line_subtotal, period_start, period_end, item_status)
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, DATE(?), DATE(?), 'reserved')`,
          [
            contractId,
            line.toolId,
            unitId,
            line.daily_rate,
            line.deposit_snapshot,
            rentalDays,
            line.per_unit_subtotal,
            startSql,
            endSql,
          ]
        );
        await conn.execute(`UPDATE tool_units SET status = 'reserved' WHERE id = ?`, [unitId]);
      }
    }

    const deliveryNotes =
      fulfillmentMode === 'delivery' ? 'Deliver equipment to customer' : 'Customer pickup — verify ID';
    const [dRes] = await conn.execute(
      `INSERT INTO contract_fulfillment_jobs
       (rental_contract_id, job_type, job_status, address_id, scheduled_at, notes)
       VALUES (?, 'delivery', 'unassigned', ?, ?, ?)`,
      [contractId, deliveryAddressId, startSql, deliveryNotes]
    );
    fulfillmentJobIds.push(dRes.insertId);

    const [pRes] = await conn.execute(
      `INSERT INTO contract_fulfillment_jobs
       (rental_contract_id, job_type, job_status, address_id, scheduled_at, notes)
       VALUES (?, 'pickup', 'unassigned', ?, ?, ?)`,
      [contractId, deliveryAddressId, endSql, 'Collect equipment after rental']
    );
    fulfillmentJobIds.push(pRes.insertId);

    if (processPaymentStub) {
      const depositAmount = depositTotal;
      await conn.execute(
        `INSERT INTO payments
         (rental_contract_id, amount, currency_code, payment_type, payment_method, status,
          provider, provider_payment_id, paid_at, recorded_by_user_id)
         VALUES (?, ?, 'USD', 'deposit', 'card', 'paid', 'stub', ?, NOW(), ?)`,
        [contractId, depositAmount, `stub_${contractId}_dep`, customerId]
      );
      const balanceDue = Math.max(0, grandTotal - depositAmount);
      if (balanceDue > 0.005) {
        await conn.execute(
          `INSERT INTO payments
           (rental_contract_id, amount, currency_code, payment_type, payment_method, status,
            provider, provider_payment_id, paid_at, recorded_by_user_id)
           VALUES (?, ?, 'USD', 'balance', 'card', 'paid', 'stub', ?, NOW(), ?)`,
          [contractId, balanceDue, `stub_${contractId}_bal`, customerId]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      contractId,
      contractNumber,
      totals: { subtotal, depositTotal, taxTotal, feesTotal, grandTotal },
      fulfillmentJobIds,
    });
  } catch (e) {
    await conn.rollback();
    if (e.message === 'BAD_DATE') {
      return res.status(400).json({ error: 'Invalid schedule datetime' });
    }
    if (e.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ error: 'Not enough units available for one or more tools' });
    }
    if (e.message === 'UNKNOWN_TOOL' || e.message === 'INVALID_LINE') {
      return res.status(400).json({ error: 'Invalid cart line' });
    }
    console.error(e);
    res.status(500).json({ error: 'Could not create rental contract' });
  } finally {
    conn.release();
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, contract_number, status, scheduled_start, scheduled_end, grand_total, created_at
       FROM rental_contracts
       WHERE customer_user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ contracts: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

export default router;
