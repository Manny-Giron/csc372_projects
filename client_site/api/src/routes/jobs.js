import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('associate', 'admin'),
  async (req, res) => {
    try {
      const status = req.query.status;
      const pool = getPool();
      let sql = `
        SELECT j.id, j.rental_contract_id, j.job_type, j.job_status,
               j.assigned_staff_user_id, j.scheduled_at, j.arrived_at, j.completed_at,
               j.notes, j.created_at,
               rc.contract_number, rc.customer_user_id
        FROM contract_fulfillment_jobs j
        JOIN rental_contracts rc ON rc.id = j.rental_contract_id
      `;
      const params = [];
      if (status) {
        sql += ` WHERE j.job_status = ?`;
        params.push(status);
      }
      sql += ` ORDER BY j.scheduled_at ASC LIMIT 100`;
      const [rows] = await pool.execute(sql, params);
      res.json({ jobs: rows });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to load jobs' });
    }
  }
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('associate', 'admin'),
  async (req, res) => {
    const id = Number(req.params.id);
    const { job_status, assignSelf } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    try {
      const pool = getPool();

      if (assignSelf) {
        const [r1] = await pool.execute(
          `UPDATE contract_fulfillment_jobs
           SET assigned_staff_user_id = ?, job_status = 'assigned'
           WHERE id = ?`,
          [req.user.id, id]
        );
        if (r1.affectedRows === 0) {
          return res.status(404).json({ error: 'Job not found' });
        }
      }

      if (job_status) {
        const allowed = [
          'unassigned',
          'assigned',
          'in_progress',
          'completed',
          'failed',
          'rescheduled',
          'cancelled',
        ];
        if (!allowed.includes(job_status)) {
          return res.status(400).json({ error: 'Invalid job_status' });
        }
        let sql = `UPDATE contract_fulfillment_jobs SET job_status = ?`;
        const p = [job_status];
        if (job_status === 'completed') {
          sql += `, completed_at = NOW()`;
        }
        if (job_status === 'in_progress') {
          sql += `, arrived_at = COALESCE(arrived_at, NOW())`;
        }
        sql += ` WHERE id = ?`;
        p.push(id);
        const [r2] = await pool.execute(sql, p);
        if (r2.affectedRows === 0 && !assignSelf) {
          return res.status(404).json({ error: 'Job not found' });
        }
      }

      if (!assignSelf && !job_status) {
        return res.status(400).json({ error: 'Provide assignSelf or job_status' });
      }

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Update failed' });
    }
  }
);

export default router;
