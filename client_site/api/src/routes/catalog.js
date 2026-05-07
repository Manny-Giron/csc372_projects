import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/categories', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, \`key\`, name, description, image_url, featured, sort_order
       FROM tool_categories
       ORDER BY sort_order`
    );
    res.json({ categories: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.get('/tools', async (req, res) => {
  const category = req.query.category || 'all';
  try {
    let sql = `
      SELECT t.id, t.name, t.slug, t.description, t.daily_rate, t.deposit, t.delivery_only,
             t.image_url, tc.key AS category_key, tc.name AS category_name,
             (SELECT COUNT(*) FROM tool_units tu
              WHERE tu.tool_id = t.id AND tu.status = 'available'
                    AND tu.operational_status = 'in_service') AS available_units
      FROM tools t
      JOIN tool_types tt ON t.type_id = tt.id
      JOIN tool_categories tc ON tt.category_id = tc.id
      WHERE t.is_active = 1
    `;
    const params = [];
    if (category !== 'all') {
      sql += ` AND tc.key = ?`;
      params.push(category);
    }
    sql += ` ORDER BY tc.sort_order, tt.sort_order, t.name`;
    const tools = await query(sql, params);
    res.json({ tools });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load tools' });
  }
});

router.get('/tools/slug/:slug', async (req, res) => {
  try {
    const rows = await query(
      `SELECT t.id, t.name, t.slug, t.description, t.daily_rate, t.deposit, t.delivery_only,
              t.image_url, tc.key AS category_key, tc.name AS category_name,
              tt.name AS type_name,
              (SELECT COUNT(*) FROM tool_units tu
               WHERE tu.tool_id = t.id AND tu.status = 'available'
                     AND tu.operational_status = 'in_service') AS available_units
       FROM tools t
       JOIN tool_types tt ON t.type_id = tt.id
       JOIN tool_categories tc ON tt.category_id = tc.id
       WHERE t.slug = ? AND t.is_active = 1
       LIMIT 1`,
      [req.params.slug]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    res.json({ tool: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load tool' });
  }
});

export default router;
