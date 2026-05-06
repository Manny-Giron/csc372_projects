import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, getPool } from '../db.js';
import { signToken } from '../auth.js';
import { requireAuth } from '../middleware.js';

const router = Router();

export async function getUserWithRoles(userId) {
  const rows = await query(
    `SELECT u.id, u.email, u.is_active, r.name AS role_name
     FROM users u
     LEFT JOIN user_role_assignments ura ON ura.user_id = u.id
     LEFT JOIN roles r ON r.id = ura.role_id
     WHERE u.id = ?`,
    [userId]
  );
  if (!rows.length) return null;
  const base = { id: rows[0].id, email: rows[0].email, is_active: !!rows[0].is_active };
  const roles = [...new Set(rows.map((r) => r.role_name).filter(Boolean))];
  return { ...base, roles };
}

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body || {};
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'email, password, firstName, lastName required' });
  }
  const hash = await bcrypt.hash(password, 12);
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      `INSERT INTO users (email, password_hash, is_active) VALUES (?, ?, 1)`,
      [email.trim().toLowerCase(), hash]
    );
    const userId = r.insertId;
    await conn.execute(
      `INSERT INTO customer_profiles (user_id, first_name, last_name, phone, government_id_type)
       VALUES (?, ?, ?, ?, 'none')`,
      [userId, firstName.trim(), lastName.trim(), phone?.trim() || null]
    );
    const [roleRows] = await conn.execute(`SELECT id FROM roles WHERE name = 'customer' LIMIT 1`);
    const customerRoleId = roleRows[0]?.id;
    if (customerRoleId) {
      await conn.execute(
        `INSERT INTO user_role_assignments (user_id, role_id) VALUES (?, ?)`,
        [userId, customerRoleId]
      );
    }
    await conn.commit();
    const user = await getUserWithRoles(userId);
    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    res.status(201).json({ token, user: { id: user.id, email: user.email, roles: user.roles } });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    conn.release();
  }
});
////
////
////
////
////
////
////
////
////
////
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  const rows = await query(
    `SELECT id, email, password_hash, is_active FROM users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  const row = rows[0];
  if (!row || !row.is_active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [row.id]);
  const user = await getUserWithRoles(row.id);
  const token = signToken({
    sub: user.id,
    email: user.email,
    roles: user.roles,
  });
  res.json({ token, user: { id: user.id, email: user.email, roles: user.roles } });
});
////
////
////
////
////
////
////
////
////
////
router.get('/me', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT first_name, last_name, phone FROM customer_profiles WHERE user_id = ? LIMIT 1`,
    [req.user.id]
  );
  const profile = rows[0] || null;
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
      profile,
    },
  });
});

export default router;
