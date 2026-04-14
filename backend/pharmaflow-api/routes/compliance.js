const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/compliance/schedule-register - Schedule H/H1/X sale register
  r.get('/schedule-register', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const from = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
      const to = req.query.to || new Date().toISOString();
      const scheduleType = req.query.schedule;

      let query = `SELECT sdr.*, m.brand_name, m.generic_name, m.strength,
                          u.full_name AS pharmacist_name, u.pharmacist_reg_no,
                          i.invoice_no
                   FROM schedule_drug_register sdr
                   JOIN medicines m ON sdr.medicine_id=m.medicine_id
                   LEFT JOIN users u ON sdr.pharmacist_id=u.user_id
                   LEFT JOIN invoices i ON sdr.invoice_id=i.invoice_id
                   WHERE sdr.store_id=$1 AND sdr.sale_date BETWEEN $2 AND $3`;
      const params = [storeId, from, to];

      if (scheduleType) {
        query += ' AND sdr.schedule_type=$4';
        params.push(scheduleType);
      }
      query += ' ORDER BY sdr.sale_date DESC';

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/compliance/drug-inspector-report - Instant Drug Inspector report
  r.get('/drug-inspector-report', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // Store info
      const store = await db.query(
        'SELECT store_name, store_code, drug_license_no, gstin, address, city, state FROM stores WHERE store_id=$1',
        [storeId]
      );

      // All schedule drug sales
      const sales = await db.query(
        `SELECT sdr.*, m.brand_name, m.generic_name, m.strength, m.medicine_form, m.schedule_type AS med_schedule,
                u.full_name AS pharmacist_name, u.pharmacist_reg_no, i.invoice_no
         FROM schedule_drug_register sdr
         JOIN medicines m ON sdr.medicine_id=m.medicine_id
         LEFT JOIN users u ON sdr.pharmacist_id=u.user_id
         LEFT JOIN invoices i ON sdr.invoice_id=i.invoice_id
         WHERE sdr.store_id=$1 AND sdr.sale_date >= $2 AND sdr.sale_date < $3
         ORDER BY sdr.schedule_type, sdr.sale_date`,
        [storeId, startDate, endDate]
      );

      // Summary by schedule type
      const summary = await db.query(
        `SELECT schedule_type, COUNT(*) AS total_entries, SUM(quantity_sold) AS total_qty
         FROM schedule_drug_register
         WHERE store_id=$1 AND sale_date >= $2 AND sale_date < $3
         GROUP BY schedule_type`,
        [storeId, startDate, endDate]
      );

      res.json({
        reportTitle: 'Drug Inspector Report',
        period: { month, year, from: startDate, to: endDate },
        store: store.rows[0],
        entries: sales.rows,
        summary: summary.rows,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.username
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/compliance/narcotic-register
  r.get('/narcotic-register', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT sdr.*, m.brand_name, m.generic_name, m.strength, i.invoice_no,
                u.full_name AS pharmacist_name
         FROM schedule_drug_register sdr
         JOIN medicines m ON sdr.medicine_id=m.medicine_id
         LEFT JOIN invoices i ON sdr.invoice_id=i.invoice_id
         LEFT JOIN users u ON sdr.pharmacist_id=u.user_id
         WHERE sdr.store_id=$1 AND m.is_narcotic=TRUE
         ORDER BY sdr.sale_date DESC`,
        [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/compliance/patient-history/:customerId
  r.get('/patient-history/:customerId', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT ph.*, m.brand_name, m.generic_name, m.strength, m.schedule_type, i.invoice_no, i.invoice_date
         FROM patient_history ph
         JOIN medicines m ON ph.medicine_id=m.medicine_id
         LEFT JOIN invoices i ON ph.invoice_id=i.invoice_id
         WHERE ph.customer_id=$1 ORDER BY ph.created_at DESC`,
        [req.params.customerId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/compliance/pharmacist-log - Pharmacist audit trail
  r.get('/pharmacist-log', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const from = req.query.from || new Date(Date.now() - 7 * 86400000).toISOString();
      const to = req.query.to || new Date().toISOString();
      const result = await db.query(
        `SELECT al.*, u.full_name, u.pharmacist_reg_no, r.role_name
         FROM audit_log al
         JOIN users u ON al.user_id=u.user_id
         JOIN roles r ON u.role_id=r.role_id
         WHERE al.store_id=$1 AND al.created_at BETWEEN $2 AND $3
         ORDER BY al.created_at DESC LIMIT 500`,
        [storeId, from, to]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
