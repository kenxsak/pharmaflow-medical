const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/inventory/stock?storeId=...&medicineId=... - FIFO batches
  r.get('/stock', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const where = req.query.medicineId ? 'AND ib.medicine_id=$2' : '';
      const params = req.query.medicineId ? [storeId, req.query.medicineId] : [storeId];
      const result = await db.query(
        `SELECT ib.*, m.brand_name, m.generic_name, m.pack_size, m.schedule_type, m.mrp AS catalog_mrp, m.reorder_level,
                mfr.name AS manufacturer_name,
                CASE WHEN ib.expiry_date<=CURRENT_DATE THEN 'EXPIRED'
                     WHEN ib.expiry_date<=CURRENT_DATE+INTERVAL '30 days' THEN 'EXPIRY_30'
                     WHEN ib.expiry_date<=CURRENT_DATE+INTERVAL '60 days' THEN 'EXPIRY_60'
                     WHEN ib.expiry_date<=CURRENT_DATE+INTERVAL '90 days' THEN 'EXPIRY_90'
                     ELSE 'OK' END AS expiry_status
         FROM inventory_batches ib
         JOIN medicines m ON ib.medicine_id=m.medicine_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE ib.store_id=$1 AND ib.is_active=TRUE ${where}
         ORDER BY ib.expiry_date ASC`, params
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/inventory/expiry-alerts?storeId=...
  r.get('/expiry-alerts', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const today = new Date().toISOString().split('T')[0];
      const [expired, exp30, exp60, exp90] = await Promise.all([
        db.query(`SELECT ib.*, m.brand_name, m.generic_name, mfr.name AS manufacturer_name FROM inventory_batches ib JOIN medicines m ON ib.medicine_id=m.medicine_id LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id WHERE ib.store_id=$1 AND ib.is_active=TRUE AND ib.expiry_date<=$2 AND (ib.quantity_strips>0 OR ib.quantity_loose>0)`, [storeId, today]),
        db.query(`SELECT ib.*, m.brand_name, m.generic_name, mfr.name AS manufacturer_name FROM inventory_batches ib JOIN medicines m ON ib.medicine_id=m.medicine_id LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id WHERE ib.store_id=$1 AND ib.is_active=TRUE AND ib.expiry_date>$2 AND ib.expiry_date<=($2::date+30) AND (ib.quantity_strips>0 OR ib.quantity_loose>0)`, [storeId, today]),
        db.query(`SELECT ib.*, m.brand_name, m.generic_name, mfr.name AS manufacturer_name FROM inventory_batches ib JOIN medicines m ON ib.medicine_id=m.medicine_id LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id WHERE ib.store_id=$1 AND ib.is_active=TRUE AND ib.expiry_date>($2::date+30) AND ib.expiry_date<=($2::date+60) AND (ib.quantity_strips>0 OR ib.quantity_loose>0)`, [storeId, today]),
        db.query(`SELECT ib.*, m.brand_name, m.generic_name, mfr.name AS manufacturer_name FROM inventory_batches ib JOIN medicines m ON ib.medicine_id=m.medicine_id LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id WHERE ib.store_id=$1 AND ib.is_active=TRUE AND ib.expiry_date>($2::date+60) AND ib.expiry_date<=($2::date+90) AND (ib.quantity_strips>0 OR ib.quantity_loose>0)`, [storeId, today]),
      ]);
      const calcValue = rows => rows.reduce((s, r) => s + r.quantity_strips * +r.mrp, 0);
      res.json({
        expired: expired.rows, expiring30Days: exp30.rows, expiring60Days: exp60.rows, expiring90Days: exp90.rows,
        totalExpiredValue: calcValue(expired.rows), totalAtRisk30Value: calcValue(exp30.rows),
        summary: { expired: expired.rows.length, expiring30: exp30.rows.length, expiring60: exp60.rows.length, expiring90: exp90.rows.length }
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/inventory/shortage - Items below reorder level
  r.get('/shortage', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT m.medicine_id, m.brand_name, m.generic_name, m.reorder_level, m.pack_size,
                mfr.name AS manufacturer_name,
                COALESCE(SUM(ib.quantity_strips),0) AS total_strips,
                COALESCE(SUM(ib.quantity_loose),0) AS total_loose
         FROM medicines m
         LEFT JOIN inventory_batches ib ON m.medicine_id=ib.medicine_id AND ib.store_id=$1 AND ib.is_active=TRUE AND ib.expiry_date>CURRENT_DATE
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE m.is_active=TRUE
         GROUP BY m.medicine_id, m.brand_name, m.generic_name, m.reorder_level, m.pack_size, mfr.name
         HAVING COALESCE(SUM(ib.quantity_strips),0) < m.reorder_level
         ORDER BY COALESCE(SUM(ib.quantity_strips),0) ASC`,
        [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/inventory/transfer - Inter-store stock transfer
  r.post('/transfer', requireRole('SUPER_ADMIN', 'WAREHOUSE_MGR', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { fromStoreId, toStoreId, medicineId, batchId, quantityStrips, quantityLoose } = req.body;
      const result = await db.query(
        `INSERT INTO stock_transfers (from_store_id,to_store_id,medicine_id,batch_id,quantity_strips,quantity_loose,requested_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [fromStoreId, toStoreId, medicineId, batchId, quantityStrips, quantityLoose || 0, req.user.userId]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/inventory/transfer/:id/receive
  r.put('/transfer/:id/receive', async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const transfer = await client.query('SELECT * FROM stock_transfers WHERE transfer_id=$1', [req.params.id]);
      if (!transfer.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
      const t = transfer.rows[0];

      // Deduct from source
      await client.query('UPDATE inventory_batches SET quantity_strips=quantity_strips-$1, quantity_loose=quantity_loose-$2 WHERE batch_id=$3', [t.quantity_strips, t.quantity_loose, t.batch_id]);

      // Get batch details
      const batch = await client.query('SELECT * FROM inventory_batches WHERE batch_id=$1', [t.batch_id]);
      const b = batch.rows[0];

      // Create batch at destination
      await client.query(
        `INSERT INTO inventory_batches (store_id,medicine_id,batch_number,manufacture_date,expiry_date,quantity_strips,quantity_loose,purchase_rate,mrp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [t.to_store_id, t.medicine_id, b.batch_number, b.manufacture_date, b.expiry_date, t.quantity_strips, t.quantity_loose, b.purchase_rate, b.mrp]
      );

      await client.query("UPDATE stock_transfers SET status='RECEIVED', approved_by=$1, completed_at=NOW() WHERE transfer_id=$2", [req.user.userId, req.params.id]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // GET /api/inventory/transfers
  r.get('/transfers', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT st.*, m.brand_name, sf.store_name AS from_store, sto.store_name AS to_store
         FROM stock_transfers st JOIN medicines m ON st.medicine_id=m.medicine_id
         JOIN stores sf ON st.from_store_id=sf.store_id JOIN stores sto ON st.to_store_id=sto.store_id
         WHERE st.from_store_id=$1 OR st.to_store_id=$1 ORDER BY st.created_at DESC`, [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/inventory/batch - Add new batch (from purchase)
  r.post('/batch', requireRole('SUPER_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_MGR'), async (req, res) => {
    try {
      const b = req.body;
      const result = await db.query(
        `INSERT INTO inventory_batches (store_id,medicine_id,batch_number,manufacture_date,expiry_date,quantity_strips,quantity_loose,purchase_rate,mrp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [b.storeId || req.user.storeId, b.medicineId, b.batchNumber, b.manufactureDate, b.expiryDate, b.quantityStrips, b.quantityLoose || 0, b.purchaseRate, b.mrp]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
