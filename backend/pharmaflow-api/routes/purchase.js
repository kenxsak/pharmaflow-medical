const { Router } = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generatePONumber } = require('../utils/invoice');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // POST /api/purchase/order - Create purchase order
  r.post('/order', requireRole('SUPER_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_MGR'), async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { supplierId, invoiceNumber, items, storeId: bodyStoreId } = req.body;
      const storeId = bodyStoreId || req.user.storeId;
      const poNumber = await generatePONumber(db, storeId);

      let subtotal = 0, cgst = 0, sgst = 0;
      for (const item of items) {
        const lineTotal = item.purchaseRate * (item.quantity + (item.freeQty || 0));
        const gstAmt = lineTotal * (item.gstRate || 12) / 100;
        subtotal += lineTotal;
        cgst += gstAmt / 2;
        sgst += gstAmt / 2;
      }

      const po = await client.query(
        `INSERT INTO purchase_orders (store_id,supplier_id,po_number,invoice_number,subtotal,cgst_amount,sgst_amount,total_amount,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [storeId, supplierId, poNumber, invoiceNumber, subtotal, cgst, sgst, subtotal + cgst + sgst, req.user.userId]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_order_items (po_id,medicine_id,batch_number,expiry_date,quantity,free_qty,purchase_rate,mrp,gst_rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [po.rows[0].po_id, item.medicineId, item.batchNumber, item.expiryDate, item.quantity, item.freeQty || 0, item.purchaseRate, item.mrp, item.gstRate || 12]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(po.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // PUT /api/purchase/order/:id/receive - Receive PO and add to inventory
  r.put('/order/:id/receive', requireRole('SUPER_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_MGR'), async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const po = await client.query('SELECT * FROM purchase_orders WHERE po_id=$1', [req.params.id]);
      if (!po.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'PO not found' }); }

      const items = await client.query('SELECT * FROM purchase_order_items WHERE po_id=$1', [req.params.id]);

      for (const item of items.rows) {
        const totalQty = item.quantity + item.free_qty;
        await client.query(
          `INSERT INTO inventory_batches (store_id,medicine_id,batch_number,expiry_date,quantity_strips,purchase_rate,mrp)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [po.rows[0].store_id, item.medicine_id, item.batch_number, item.expiry_date, totalQty, item.purchase_rate, item.mrp]
        );
      }

      await client.query("UPDATE purchase_orders SET status='RECEIVED' WHERE po_id=$1", [req.params.id]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'PO received and inventory updated' });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // GET /api/purchase/orders
  r.get('/orders', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT po.*, s.name AS supplier_name, u.full_name AS created_by_name
         FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id=s.supplier_id
         LEFT JOIN users u ON po.created_by=u.user_id
         WHERE po.store_id=$1 ORDER BY po.po_date DESC`, [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/purchase/import-csv - Bulk import purchase from CSV/Excel
  r.post('/import-csv', requireRole('SUPER_ADMIN', 'STORE_MANAGER', 'WAREHOUSE_MGR'),
    upload.single('file'), async (req, res) => {
    const client = await db.connect();
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      await client.query('BEGIN');
      const storeId = req.body.storeId || req.user.storeId;
      const supplierId = req.body.supplierId;
      const poNumber = await generatePONumber(db, storeId);

      let subtotal = 0;
      const po = await client.query(
        `INSERT INTO purchase_orders (store_id,supplier_id,po_number,subtotal,total_amount,created_by,status)
         VALUES ($1,$2,$3,0,0,$4,'RECEIVED') RETURNING *`,
        [storeId, supplierId, poNumber, req.user.userId]
      );

      let imported = 0;
      const errors = [];

      for (const row of rows) {
        try {
          // Expected columns: brand_name or barcode, batch_number, expiry_date, quantity, free_qty, purchase_rate, mrp, gst_rate
          const brandName = row.brand_name || row.BrandName || row.medicine;
          const barcode = row.barcode || row.Barcode;
          let med;
          if (barcode) {
            med = await client.query('SELECT medicine_id FROM medicines WHERE barcode=$1', [barcode]);
          }
          if ((!med || !med.rows.length) && brandName) {
            med = await client.query('SELECT medicine_id FROM medicines WHERE brand_name ILIKE $1 LIMIT 1', [brandName]);
          }
          if (!med || !med.rows.length) {
            errors.push(`Row ${imported + 1}: Medicine "${brandName || barcode}" not found`);
            continue;
          }

          const batchNumber = row.batch_number || row.BatchNumber || row.batch || 'IMPORTED';
          const expiryDate = row.expiry_date || row.ExpiryDate || row.expiry;
          const qty = parseInt(row.quantity || row.Quantity || row.qty || 0);
          const freeQty = parseInt(row.free_qty || row.FreeQty || row.free || 0);
          const purchaseRate = parseFloat(row.purchase_rate || row.PurchaseRate || row.rate || 0);
          const mrp = parseFloat(row.mrp || row.MRP || 0);

          if (!qty || !purchaseRate || !mrp || !expiryDate) {
            errors.push(`Row ${imported + 1}: Missing required fields`);
            continue;
          }

          await client.query(
            `INSERT INTO purchase_order_items (po_id,medicine_id,batch_number,expiry_date,quantity,free_qty,purchase_rate,mrp,gst_rate)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [po.rows[0].po_id, med.rows[0].medicine_id, batchNumber, expiryDate, qty, freeQty, purchaseRate, mrp, row.gst_rate || 12]
          );

          // Add to inventory
          await client.query(
            `INSERT INTO inventory_batches (store_id,medicine_id,batch_number,expiry_date,quantity_strips,purchase_rate,mrp)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [storeId, med.rows[0].medicine_id, batchNumber, expiryDate, qty + freeQty, purchaseRate, mrp]
          );

          subtotal += purchaseRate * qty;
          imported++;
        } catch (rowErr) {
          errors.push(`Row ${imported + 1}: ${rowErr.message}`);
        }
      }

      await client.query('UPDATE purchase_orders SET subtotal=$1, total_amount=$1 WHERE po_id=$2', [subtotal, po.rows[0].po_id]);
      await client.query('COMMIT');

      res.json({ success: true, imported, totalRows: rows.length, errors, poNumber });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // GET /api/purchase/schemes - Purchase schemes (Buy 10 Get 1)
  r.get('/schemes', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT ps.*, m.brand_name, s.name AS supplier_name
         FROM purchase_schemes ps
         JOIN medicines m ON ps.medicine_id=m.medicine_id
         LEFT JOIN suppliers s ON ps.supplier_id=s.supplier_id
         WHERE ps.is_active=TRUE ORDER BY m.brand_name`
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/purchase/schemes
  r.post('/schemes', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { supplierId, medicineId, buyQty, freeQty, validFrom, validTo } = req.body;
      const result = await db.query(
        `INSERT INTO purchase_schemes (supplier_id,medicine_id,buy_qty,free_qty,valid_from,valid_to) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [supplierId, medicineId, buyQty, freeQty, validFrom, validTo]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // -- Suppliers CRUD --
  r.get('/suppliers', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM suppliers WHERE is_active=TRUE ORDER BY name');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  r.post('/suppliers', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { name, contact, phone, email, gstin, drugLicense, address } = req.body;
      const result = await db.query(
        `INSERT INTO suppliers (name,contact,phone,email,gstin,drug_license,address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, contact, phone, email, gstin, drugLicense, address]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
