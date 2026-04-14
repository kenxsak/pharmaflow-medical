const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();

  // POST /api/auth/login
  r.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await db.query(
        `SELECT u.*, r.role_name, r.can_edit_price, r.can_sell_schedule_h, r.can_view_reports, r.can_manage_inventory,
                s.store_name, s.store_code
         FROM users u JOIN roles r ON u.role_id=r.role_id LEFT JOIN stores s ON u.store_id=s.store_id
         WHERE u.username=$1 AND u.is_active=TRUE`, [username]
      );
      if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      await db.query('UPDATE users SET last_login=NOW() WHERE user_id=$1', [user.user_id]);
      const token = generateToken(user);
      res.json({
        token, user: {
          userId: user.user_id, username: user.username, fullName: user.full_name,
          role: user.role_name, storeId: user.store_id, storeName: user.store_name, storeCode: user.store_code,
          canEditPrice: user.can_edit_price, canSellScheduleH: user.can_sell_schedule_h,
          canViewReports: user.can_view_reports, canManageInventory: user.can_manage_inventory,
          pharmacistRegNo: user.pharmacist_reg_no
        }
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/auth/register (admin only)
  r.post('/register', authMiddleware, requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { username, password, fullName, phone, email, roleId, storeId, pharmacistRegNo } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (store_id,username,password_hash,full_name,phone,email,role_id,pharmacist_reg_no) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING user_id, username, full_name`,
        [storeId, username, hash, fullName, phone, email, roleId, pharmacistRegNo]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/auth/me
  r.get('/me', authMiddleware, async (req, res) => {
    try {
      const result = await db.query(
        `SELECT u.*, r.role_name, s.store_name, s.store_code FROM users u JOIN roles r ON u.role_id=r.role_id LEFT JOIN stores s ON u.store_id=s.store_id WHERE u.user_id=$1`,
        [req.user.userId]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
      const u = result.rows[0];
      res.json({ userId: u.user_id, username: u.username, fullName: u.full_name, role: u.role_name, storeId: u.store_id, storeName: u.store_name });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/auth/users (list users for a store)
  r.get('/users', authMiddleware, requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT u.user_id, u.username, u.full_name, u.phone, u.email, u.is_active, u.last_login, u.pharmacist_reg_no, r.role_name, s.store_name
         FROM users u JOIN roles r ON u.role_id=r.role_id LEFT JOIN stores s ON u.store_id=s.store_id
         WHERE ($1::uuid IS NULL OR u.store_id=$1) ORDER BY u.full_name`,
        [storeId === 'all' ? null : storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/auth/roles
  r.get('/roles', authMiddleware, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM roles ORDER BY role_id');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
