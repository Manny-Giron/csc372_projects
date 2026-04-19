import { Router } from 'express';
import { getPool } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

const router = Router();

router.get(
  '/summary',
  requireAuth,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const pool = getPool();
      const [[contracts]] = await pool.execute(
        `SELECT
           COUNT(*) AS total_contracts,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_contracts,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_contracts
         FROM rental_contracts`
      );
      const [[payments]] = await pool.execute(
        `SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS revenue_paid
         FROM payments`
      );
      const [[metrics]] = await pool.execute(
        `SELECT metric_date, total_revenue, rentals_started_count, overdue_rentals_count
         FROM daily_business_metrics
         ORDER BY metric_date DESC
         LIMIT 1`
      );
      res.json({
        contracts,
        payments,
        latestDailyMetrics: metrics || null,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to load summary' });
    }
  }
);

export default router;
