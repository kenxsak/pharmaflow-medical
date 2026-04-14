const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/stores
  r.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM stores WHERE is_active=TRUE ORDER BY store_code');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/stores/:id
  r.get('/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM stores WHERE store_id=$1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/stores
  r.post('/', requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const { storeCode, storeName, storeType, address, city, state, pincode, phone, email, gstin, drugLicenseNo } = req.body;
      const result = await db.query(
        `INSERT INTO stores (store_code,store_name,store_type,address,city,state,pincode,phone,email,gstin,drug_license_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [storeCode, storeName, storeType, address, city, state || 'Tamil Nadu', pincode, phone, email, gstin, drugLicenseNo]
      );
      // Initialize invoice sequence
      await db.query(
        `INSERT INTO invoice_sequence (store_id,financial_year,last_number) VALUES ($1,'2025-26',0)`,
        [result.rows[0].store_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/stores/:id/dashboard - Store dashboard summary
  r.get('/:id/dashboard', async (req, res) => {
    try {
      const storeId = req.params.id;
      const today = new Date().toISOString().split('T')[0];
      const [sales, stockValue, expiryCount, shortageCount] = await Promise.all([
        db.query(`SELECT COUNT(*) AS invoice_count, COALESCE(SUM(total_amount),0) AS total_sales FROM invoices WHERE store_id=$1 AND invoice_date::date=$2 AND is_cancelled=FALSE`, [storeId, today]),
        db.query(`SELECT COALESCE(SUM(quantity_strips * mrp),0) AS total_value FROM inventory_batches WHERE store_id=$1 AND is_active=TRUE AND expiry_date>CURRENT_DATE`, [storeId]),
        db.query(`SELECT COUNT(*) AS count FROM inventory_batches WHERE store_id=$1 AND is_active=TRUE AND expiry_date<=CURRENT_DATE+INTERVAL '30 days' AND quantity_strips>0`, [storeId]),
        db.query(`SELECT COUNT(*) FROM (SELECT m.medicine_id FROM medicines m LEFT JOIN inventory_batches ib ON m.medicine_id=ib.medicine_id AND ib.store_id=$1 AND ib.is_active=TRUE WHERE m.is_active=TRUE GROUP BY m.medicine_id, m.reorder_level HAVING COALESCE(SUM(ib.quantity_strips),0)<m.reorder_level) sq`, [storeId]),
      ]);
      res.json({
        todaySales: +sales.rows[0].total_sales,
        todayInvoices: +sales.rows[0].invoice_count,
        stockValue: +stockValue.rows[0].total_value,
        expiringIn30Days: +expiryCount.rows[0].count,
        shortageItems: +shortageCount.rows[0].count
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/stores/audit-log
  r.get('/:id/audit-log', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const result = await db.query(
        `SELECT al.*, u.full_name, u.username FROM audit_log al LEFT JOIN users u ON al.user_id=u.user_id
         WHERE al.store_id=$1 ORDER BY al.created_at DESC LIMIT 200`, [req.params.id]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
