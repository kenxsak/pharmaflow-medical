const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/customers/search?q=phone_or_name
  r.get('/search', async (req, res) => {
    try {
      const q = `%${req.query.q || ''}%`;
      const result = await db.query(
        `SELECT * FROM customers WHERE (name ILIKE $1 OR phone ILIKE $1) AND is_active=TRUE ORDER BY name LIMIT 20`, [q]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/customers/:id
  r.get('/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM customers WHERE customer_id=$1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      // Get recent invoices
      const invoices = await db.query(
        `SELECT invoice_id, invoice_no, invoice_date, total_amount, payment_mode FROM invoices WHERE customer_id=$1 ORDER BY invoice_date DESC LIMIT 10`,
        [req.params.id]
      );
      res.json({ ...result.rows[0], recentInvoices: invoices.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/customers
  r.post('/', async (req, res) => {
    try {
      const { name, phone, email, address, doctorName, creditLimit, storeId } = req.body;
      const result = await db.query(
        `INSERT INTO customers (store_id,name,phone,email,address,doctor_name,credit_limit)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [storeId || req.user.storeId, name, phone, email, address, doctorName, creditLimit || 0]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(400).json({ error: 'Phone number already registered' });
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /api/customers/:id
  r.put('/:id', async (req, res) => {
    try {
      const b = req.body;
      const result = await db.query(
        `UPDATE customers SET name=COALESCE($2,name), phone=COALESCE($3,phone), email=COALESCE($4,email),
         address=COALESCE($5,address), doctor_name=COALESCE($6,doctor_name), credit_limit=COALESCE($7,credit_limit),
         is_blocked=COALESCE($8,is_blocked)
         WHERE customer_id=$1 RETURNING *`,
        [req.params.id, b.name, b.phone, b.email, b.address, b.doctorName, b.creditLimit, b.isBlocked]
      );
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/customers/:id/payment - Record credit payment
  r.post('/:id/payment', async (req, res) => {
    try {
      const { amount } = req.body;
      const result = await db.query(
        'UPDATE customers SET current_balance=current_balance-$1 WHERE customer_id=$2 RETURNING *',
        [amount, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/customers/:id/redeem-points
  r.post('/:id/redeem-points', async (req, res) => {
    try {
      const { points } = req.body;
      const cust = await db.query('SELECT loyalty_points FROM customers WHERE customer_id=$1', [req.params.id]);
      if (!cust.rows.length) return res.status(404).json({ error: 'Not found' });
      if (cust.rows[0].loyalty_points < points) return res.status(400).json({ error: 'Insufficient points' });

      await db.query('UPDATE customers SET loyalty_points=loyalty_points-$1 WHERE customer_id=$2', [points, req.params.id]);
      await db.query(
        `INSERT INTO loyalty_transactions (customer_id,store_id,points_redeemed,balance_after,description)
         SELECT $1,$2,$3,loyalty_points,'Points redeemed' FROM customers WHERE customer_id=$1`,
        [req.params.id, req.user.storeId, points]
      );
      // 1 point = 1 rupee discount
      res.json({ discountAmount: points, message: `Redeemed ${points} points = Rs.${points} discount` });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/customers/:id/loyalty-history
  r.get('/:id/loyalty-history', async (req, res) => {
    try {
      const result = await db.query(
        'SELECT * FROM loyalty_transactions WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 50',
        [req.params.id]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/customers/credit/outstanding - All customers with outstanding credit
  r.get('/credit/outstanding', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT * FROM customers WHERE store_id=$1 AND current_balance>0 ORDER BY current_balance DESC`,
        [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
