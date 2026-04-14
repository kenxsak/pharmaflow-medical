const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getFinancialYear } = require('../utils/invoice');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/reports/gstr1 - GSTR-1 report (outward supplies)
  r.get('/gstr1', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // B2B invoices (with GSTIN)
      const b2b = await db.query(
        `SELECT i.invoice_no, i.invoice_date, i.taxable_amount, i.cgst_amount, i.sgst_amount, i.igst_amount, i.total_amount,
                c.name AS customer_name, s.gstin AS supplier_gstin
         FROM invoices i LEFT JOIN customers c ON i.customer_id=c.customer_id
         JOIN stores s ON i.store_id=s.store_id
         WHERE i.store_id=$1 AND i.invoice_date>=$2 AND i.invoice_date<$3 AND i.is_cancelled=FALSE AND i.invoice_type='SALE'
         ORDER BY i.invoice_date`, [storeId, startDate, endDate]
      );

      // HSN-wise summary
      const hsn = await db.query(
        `SELECT m.hsn_code, ii.gst_rate, COUNT(*) AS num_items,
                SUM(ii.taxable_amount) AS taxable_value, SUM(ii.cgst) AS cgst, SUM(ii.sgst) AS sgst, SUM(ii.igst) AS igst,
                SUM(ii.total) AS total_value
         FROM invoice_items ii JOIN medicines m ON ii.medicine_id=m.medicine_id
         JOIN invoices i ON ii.invoice_id=i.invoice_id
         WHERE i.store_id=$1 AND i.invoice_date>=$2 AND i.invoice_date<$3 AND i.is_cancelled=FALSE
         GROUP BY m.hsn_code, ii.gst_rate ORDER BY m.hsn_code`, [storeId, startDate, endDate]
      );

      // Summary totals
      const totals = await db.query(
        `SELECT COUNT(*) AS total_invoices, SUM(taxable_amount) AS total_taxable,
                SUM(cgst_amount) AS total_cgst, SUM(sgst_amount) AS total_sgst, SUM(igst_amount) AS total_igst,
                SUM(total_amount) AS total_value
         FROM invoices WHERE store_id=$1 AND invoice_date>=$2 AND invoice_date<$3 AND is_cancelled=FALSE AND invoice_type='SALE'`,
        [storeId, startDate, endDate]
      );

      res.json({
        reportType: 'GSTR-1', period: { month, year }, financialYear: getFinancialYear(),
        b2bInvoices: b2b.rows, hsnSummary: hsn.rows, totals: totals.rows[0]
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/gstr3b - GSTR-3B report (summary return)
  r.get('/gstr3b', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // Outward supplies
      const outward = await db.query(
        `SELECT SUM(taxable_amount) AS taxable, SUM(cgst_amount) AS cgst, SUM(sgst_amount) AS sgst, SUM(igst_amount) AS igst
         FROM invoices WHERE store_id=$1 AND invoice_date>=$2 AND invoice_date<$3 AND is_cancelled=FALSE AND invoice_type='SALE'`,
        [storeId, startDate, endDate]
      );

      // Input tax (from purchases)
      const input = await db.query(
        `SELECT SUM(cgst_amount) AS cgst, SUM(sgst_amount) AS sgst, SUM(total_amount-cgst_amount-sgst_amount) AS taxable
         FROM purchase_orders WHERE store_id=$1 AND po_date>=$2 AND po_date<$3 AND status!='CANCELLED'`,
        [storeId, startDate, endDate]
      );

      const outData = outward.rows[0];
      const inData = input.rows[0];
      const netCgst = (+outData.cgst || 0) - (+inData.cgst || 0);
      const netSgst = (+outData.sgst || 0) - (+inData.sgst || 0);

      res.json({
        reportType: 'GSTR-3B', period: { month, year },
        outwardSupplies: { taxable: +outData.taxable || 0, cgst: +outData.cgst || 0, sgst: +outData.sgst || 0, igst: +outData.igst || 0 },
        inputTaxCredit: { taxable: +inData.taxable || 0, cgst: +inData.cgst || 0, sgst: +inData.sgst || 0 },
        netTaxPayable: { cgst: Math.max(0, netCgst), sgst: Math.max(0, netSgst) },
        totalPayable: Math.max(0, netCgst) + Math.max(0, netSgst)
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/daily-sales
  r.get('/daily-sales', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const result = await db.query(
        `SELECT i.invoice_id, i.invoice_no, i.invoice_date, i.total_amount, i.payment_mode, i.discount_amount,
                c.name AS customer_name, u.full_name AS billed_by
         FROM invoices i LEFT JOIN customers c ON i.customer_id=c.customer_id LEFT JOIN users u ON i.billed_by=u.user_id
         WHERE i.store_id=$1 AND i.invoice_date::date=$2 AND i.is_cancelled=FALSE
         ORDER BY i.invoice_date`, [storeId, date]
      );

      const summary = await db.query(
        `SELECT payment_mode, COUNT(*) AS count, SUM(total_amount) AS total
         FROM invoices WHERE store_id=$1 AND invoice_date::date=$2 AND is_cancelled=FALSE
         GROUP BY payment_mode`, [storeId, date]
      );

      const totalSales = result.rows.reduce((s, r) => s + +r.total_amount, 0);
      res.json({ date, invoices: result.rows, paymentSummary: summary.rows, totalSales, totalInvoices: result.rows.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/top-selling
  r.get('/top-selling', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const days = parseInt(req.query.days) || 30;
      const result = await db.query(
        `SELECT m.medicine_id, m.brand_name, m.generic_name, mfr.name AS manufacturer_name,
                SUM(ii.quantity) AS total_qty, SUM(ii.total) AS total_revenue, COUNT(DISTINCT ii.invoice_id) AS num_invoices
         FROM invoice_items ii JOIN medicines m ON ii.medicine_id=m.medicine_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         JOIN invoices i ON ii.invoice_id=i.invoice_id
         WHERE i.store_id=$1 AND i.invoice_date>=CURRENT_DATE-$2::int AND i.is_cancelled=FALSE
         GROUP BY m.medicine_id, m.brand_name, m.generic_name, mfr.name
         ORDER BY total_qty DESC LIMIT 50`,
        [storeId, days]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/slow-moving
  r.get('/slow-moving', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT m.medicine_id, m.brand_name, m.generic_name,
                COALESCE(SUM(ib.quantity_strips),0) AS current_stock,
                COALESCE(sales.total_qty,0) AS sold_last_90_days,
                m.mrp * COALESCE(SUM(ib.quantity_strips),0) AS stock_value
         FROM medicines m
         LEFT JOIN inventory_batches ib ON m.medicine_id=ib.medicine_id AND ib.store_id=$1 AND ib.is_active=TRUE
         LEFT JOIN (SELECT ii.medicine_id, SUM(ii.quantity) AS total_qty FROM invoice_items ii
                    JOIN invoices i ON ii.invoice_id=i.invoice_id
                    WHERE i.store_id=$1 AND i.invoice_date>=CURRENT_DATE-90 AND i.is_cancelled=FALSE
                    GROUP BY ii.medicine_id) sales ON m.medicine_id=sales.medicine_id
         WHERE m.is_active=TRUE
         GROUP BY m.medicine_id, m.brand_name, m.generic_name, m.mrp, sales.total_qty
         HAVING COALESCE(SUM(ib.quantity_strips),0)>0 AND COALESCE(sales.total_qty,0)<3
         ORDER BY stock_value DESC LIMIT 50`, [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/profit-by-manufacturer
  r.get('/profit-by-manufacturer', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const days = parseInt(req.query.days) || 30;
      const result = await db.query(
        `SELECT mfr.name AS manufacturer_name,
                COUNT(DISTINCT i.invoice_id) AS total_invoices,
                SUM(ii.quantity) AS total_qty,
                SUM(ii.total) AS total_revenue,
                SUM(ii.quantity * ib.purchase_rate) AS total_cost,
                SUM(ii.total) - SUM(ii.quantity * ib.purchase_rate) AS profit,
                ROUND(((SUM(ii.total) - SUM(ii.quantity * ib.purchase_rate)) / NULLIF(SUM(ii.total),0) * 100)::numeric, 2) AS margin_pct
         FROM invoice_items ii
         JOIN medicines m ON ii.medicine_id=m.medicine_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         JOIN invoices i ON ii.invoice_id=i.invoice_id
         LEFT JOIN inventory_batches ib ON ii.batch_id=ib.batch_id
         WHERE i.store_id=$1 AND i.invoice_date>=CURRENT_DATE-$2::int AND i.is_cancelled=FALSE
         GROUP BY mfr.name ORDER BY profit DESC`,
        [storeId, days]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/profit-by-category
  r.get('/profit-by-category', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const days = parseInt(req.query.days) || 30;
      const result = await db.query(
        `SELECT sc.drug_class AS category,
                SUM(ii.quantity) AS total_qty, SUM(ii.total) AS total_revenue,
                SUM(ii.quantity * ib.purchase_rate) AS total_cost,
                SUM(ii.total) - SUM(ii.quantity * ib.purchase_rate) AS profit
         FROM invoice_items ii
         JOIN medicines m ON ii.medicine_id=m.medicine_id
         LEFT JOIN salt_compositions sc ON m.salt_id=sc.salt_id
         JOIN invoices i ON ii.invoice_id=i.invoice_id
         LEFT JOIN inventory_batches ib ON ii.batch_id=ib.batch_id
         WHERE i.store_id=$1 AND i.invoice_date>=CURRENT_DATE-$2::int AND i.is_cancelled=FALSE
         GROUP BY sc.drug_class ORDER BY profit DESC`,
        [storeId, days]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/expiry-loss
  r.get('/expiry-loss', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT m.brand_name, m.generic_name, ib.batch_number, ib.expiry_date,
                ib.quantity_strips, ib.mrp, ib.quantity_strips * ib.mrp AS loss_value,
                mfr.name AS manufacturer_name
         FROM inventory_batches ib
         JOIN medicines m ON ib.medicine_id=m.medicine_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE ib.store_id=$1 AND ib.expiry_date<=CURRENT_DATE AND ib.quantity_strips>0 AND ib.is_active=TRUE
         ORDER BY loss_value DESC`, [storeId]
      );
      const totalLoss = result.rows.reduce((s, r) => s + +r.loss_value, 0);
      res.json({ items: result.rows, totalLossValue: totalLoss });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/store-comparison - Compare sales across stores
  r.get('/store-comparison', requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const result = await db.query(
        `SELECT s.store_code, s.store_name, s.city,
                COUNT(DISTINCT i.invoice_id) AS total_invoices,
                COALESCE(SUM(i.total_amount),0) AS total_sales,
                COALESCE(AVG(i.total_amount),0) AS avg_bill_value
         FROM stores s
         LEFT JOIN invoices i ON s.store_id=i.store_id AND i.invoice_date>=CURRENT_DATE-$1::int AND i.is_cancelled=FALSE
         WHERE s.store_type='STORE' AND s.is_active=TRUE
         GROUP BY s.store_id, s.store_code, s.store_name, s.city
         ORDER BY total_sales DESC`, [days]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/reports/export?report=...&format=json - Export data (frontend converts to Excel)
  r.get('/export', async (req, res) => {
    try {
      // This returns JSON which the frontend converts to Excel using xlsx library
      const storeId = req.query.storeId || req.user.storeId;
      const from = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
      const to = req.query.to || new Date().toISOString();

      const result = await db.query(
        `SELECT i.invoice_no, i.invoice_date, i.total_amount, i.taxable_amount, i.cgst_amount, i.sgst_amount,
                i.payment_mode, i.discount_amount, c.name AS customer_name, u.full_name AS billed_by
         FROM invoices i LEFT JOIN customers c ON i.customer_id=c.customer_id LEFT JOIN users u ON i.billed_by=u.user_id
         WHERE i.store_id=$1 AND i.invoice_date BETWEEN $2 AND $3 AND i.is_cancelled=FALSE
         ORDER BY i.invoice_date`, [storeId, from, to]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
