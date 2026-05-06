import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db.js';
import { signToken } from '../auth.js';
import { requireAuth } from '../middleware.js';
import { getUserWithRoles } from './auth.js';

const router = Router();

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS c FROM rental_contracts
       WHERE customer_user_id = ? AND status NOT IN ('draft', 'cancelled')`,
      [userId]
    );
    const [sumRows] = await pool.execute(
      `SELECT COALESCE(SUM(p.amount), 0) AS total
       FROM payments p
       INNER JOIN rental_contracts rc ON rc.id = p.rental_contract_id
       WHERE rc.customer_user_id = ? AND p.status = 'paid'`,
      [userId]
    );
    res.json({
      rentalCount: Number(countRows[0]?.c) || 0,
      totalSpent: Number(sumRows[0]?.total) || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load account summary' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { firstName, lastName, phone } = req.body || {};
  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    firstName.trim().length < 1 ||
    lastName.trim().length < 1
  ) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  const phoneVal = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
  const pool = getPool();
  const userId = req.user.id;
  try {
    const [exists] = await pool.execute(
      `SELECT 1 AS ok FROM customer_profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (exists.length) {
      await pool.execute(
        `UPDATE customer_profiles
         SET first_name = ?, last_name = ?, phone = ?
         WHERE user_id = ?`,
        [firstName.trim(), lastName.trim(), phoneVal, userId]
      );
    } else {
      const u = await getUserWithRoles(userId);
      if (!u || !u.roles.includes('customer')) {
        return res
          .status(400)
          .json({ error: 'No customer profile on this account. Contact support to add one.' });
      }
      await pool.execute(
        `INSERT INTO customer_profiles (user_id, first_name, last_name, phone, government_id_type)
         VALUES (?, ?, ?, ?, 'none')`,
        [userId, firstName.trim(), lastName.trim(), phoneVal]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

router.patch('/email', requireAuth, async (req, res) => {
  const { newEmail, currentPassword } = req.body || {};
  if (typeof newEmail !== 'string' || typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'newEmail and currentPassword are required' });
  }
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  const pool = getPool();
  const userId = req.user.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id, email, password_hash FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    const match = await bcrypt.compare(currentPassword, row.password_hash);
    if (!match) {
      await conn.rollback();
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (row.email === email) {
      await conn.rollback();
      return res.status(400).json({ error: 'That is already your email address' });
    }
    const [taken] = await conn.execute(`SELECT id FROM users WHERE email = ? AND id != ?`, [
      email,
      userId,
    ]);
    if (taken.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'That email is already in use' });
    }
    await conn.execute(`UPDATE users SET email = ? WHERE id = ?`, [email, userId]);
    await conn.commit();
    const user = await getUserWithRoles(userId);
    const token = signToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    res.json({
      token,
      user: { id: user.id, email: user.email, roles: user.roles },
    });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That email is already in use' });
    }
    console.error(e);
    res.status(500).json({ error: 'Could not update email' });
  } finally {
    conn.release();
  }
});

export default router;
