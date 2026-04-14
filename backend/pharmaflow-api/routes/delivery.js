const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // POST /api/delivery - Create delivery order
  r.post('/', async (req, res) => {
    try {
      const { invoiceId, customerId, deliveryAddress, deliveryPhone, amountToCollect, paymentMode, notes } = req.body;
      const storeId = req.body.storeId || req.user.storeId;
      const result = await db.query(
        `INSERT INTO delivery_orders (invoice_id,store_id,customer_id,delivery_address,delivery_phone,amount_to_collect,payment_mode,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [invoiceId, storeId, customerId, deliveryAddress, deliveryPhone, amountToCollect || 0, paymentMode, notes]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/delivery - List deliveries for store/delivery boy
  r.get('/', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const status = req.query.status;
      let query = `SELECT d.*, c.name AS customer_name, c.phone AS customer_phone,
                          i.invoice_no, i.total_amount, u.full_name AS delivery_boy_name
                   FROM delivery_orders d
                   LEFT JOIN customers c ON d.customer_id=c.customer_id
                   LEFT JOIN invoices i ON d.invoice_id=i.invoice_id
                   LEFT JOIN users u ON d.delivery_boy_id=u.user_id
                   WHERE d.store_id=$1`;
      const params = [storeId];
      if (status) { query += ' AND d.status=$2'; params.push(status); }
      if (req.user.roleName === 'DELIVERY_BOY') {
        query += ` AND d.delivery_boy_id=$${params.length + 1}`;
        params.push(req.user.userId);
      }
      query += ' ORDER BY d.created_at DESC';
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/delivery/:id/assign
  r.put('/:id/assign', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { deliveryBoyId } = req.body;
      const result = await db.query(
        "UPDATE delivery_orders SET delivery_boy_id=$1, status='ASSIGNED', assigned_at=NOW() WHERE delivery_id=$2 RETURNING *",
        [deliveryBoyId, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/delivery/:id/status
  r.put('/:id/status', async (req, res) => {
    try {
      const { status, amountCollected } = req.body;
      const result = await db.query(
        `UPDATE delivery_orders SET status=$1, amount_collected=COALESCE($2,amount_collected),
         delivered_at=CASE WHEN $1='DELIVERED' THEN NOW() ELSE delivered_at END
         WHERE delivery_id=$3 RETURNING *`,
        [status, amountCollected, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
