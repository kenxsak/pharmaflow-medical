const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { calculateGST, calculateInvoiceTotals } = require('../utils/gst');
const { generateInvoiceNumber, generateCNNumber } = require('../utils/invoice');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // POST /api/billing/calculate - Preview GST calculation without saving
  r.post('/calculate', async (req, res) => {
    try {
      const { items, customerState } = req.body;
      const totals = calculateInvoiceTotals(items, customerState || 'Tamil Nadu');
      res.json(totals);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/billing/invoice - Create a new invoice
  r.post('/invoice', async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { customerId, items, paymentMode, prescriptionUrl, doctorName, customerState } = req.body;
      const storeId = req.body.storeId || req.user.storeId;

      // Check customer credit limit if payment is CREDIT
      if (paymentMode === 'CREDIT' && customerId) {
        const cust = await client.query('SELECT credit_limit, current_balance, is_blocked FROM customers WHERE customer_id=$1', [customerId]);
        if (cust.rows.length) {
          const c = cust.rows[0];
          if (c.is_blocked) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Customer account is blocked' }); }
        }
      }

      // Calculate GST totals
      const totals = calculateInvoiceTotals(items, customerState || 'Tamil Nadu');

      // Check credit limit against new total
      if (paymentMode === 'CREDIT' && customerId) {
        const cust = await client.query('SELECT credit_limit, current_balance FROM customers WHERE customer_id=$1', [customerId]);
        if (cust.rows.length) {
          const c = cust.rows[0];
          if (+c.current_balance + totals.totalAmount > +c.credit_limit && +c.credit_limit > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Credit limit exceeded. Limit: ${c.credit_limit}, Balance: ${c.current_balance}, Bill: ${totals.totalAmount}` });
          }
        }
      }

      const invoiceNo = await generateInvoiceNumber(db, storeId);
      const amountPaid = paymentMode === 'CREDIT' ? 0 : totals.totalAmount;
      const amountDue = totals.totalAmount - amountPaid;

      // Insert invoice
      const inv = await client.query(
        `INSERT INTO invoices (invoice_no,store_id,customer_id,billed_by,invoice_type,subtotal,discount_amount,taxable_amount,
         cgst_amount,sgst_amount,igst_amount,round_off,total_amount,payment_mode,amount_paid,amount_due,
         prescription_attached,prescription_url,doctor_name)
         VALUES ($1,$2,$3,$4,'SALE',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [invoiceNo, storeId, customerId, req.user.userId, totals.subtotal, totals.discountAmount, totals.taxableAmount,
         totals.cgstAmount, totals.sgstAmount, totals.igstAmount, totals.roundOff, totals.totalAmount,
         paymentMode || 'CASH', amountPaid, amountDue,
         !!prescriptionUrl, prescriptionUrl, doctorName]
      );
      const invoice = inv.rows[0];

      // Insert invoice items and update inventory
      for (const item of totals.items) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id,medicine_id,batch_id,quantity,unit_type,mrp,discount_pct,taxable_amount,gst_rate,cgst,sgst,igst,total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [invoice.invoice_id, item.medicineId, item.batchId, item.quantity, item.unitType || 'STRIP',
           item.mrp, item.discountPct || 0, item.taxableAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.totalAmount]
        );

        // Deduct from inventory (FIFO — batch already selected by frontend)
        if (item.unitType === 'TABLET') {
          await client.query(
            'UPDATE inventory_batches SET quantity_loose=quantity_loose-$1 WHERE batch_id=$2',
            [item.quantity, item.batchId]
          );
        } else {
          await client.query(
            'UPDATE inventory_batches SET quantity_strips=quantity_strips-$1 WHERE batch_id=$2',
            [item.quantity, item.batchId]
          );
        }

        // Block sale of expired medicines
        const batch = await client.query('SELECT expiry_date FROM inventory_batches WHERE batch_id=$1', [item.batchId]);
        if (batch.rows.length && new Date(batch.rows[0].expiry_date) <= new Date()) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Cannot sell expired batch for medicine ${item.medicineId}` });
        }

        // Record in schedule drug register if Schedule H/H1/X
        const med = await client.query('SELECT schedule_type, is_narcotic FROM medicines WHERE medicine_id=$1', [item.medicineId]);
        if (med.rows.length && ['H', 'H1', 'X'].includes(med.rows[0].schedule_type)) {
          const sd = item.scheduleData || req.body.scheduleData || {};
          if ((med.rows[0].schedule_type === 'H1' || med.rows[0].schedule_type === 'X') && !prescriptionUrl) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Prescription MANDATORY for Schedule ${med.rows[0].schedule_type} drug` });
          }
          await client.query(
            `INSERT INTO schedule_drug_register (store_id,invoice_id,medicine_id,schedule_type,patient_name,patient_age,patient_gender,patient_address,doctor_name,doctor_reg_no,quantity_sold,batch_number,pharmacist_id,prescription_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [storeId, invoice.invoice_id, item.medicineId, med.rows[0].schedule_type,
             sd.patientName || 'Walk-in', sd.patientAge, sd.patientGender, sd.patientAddress,
             doctorName || sd.doctorName || 'N/A', sd.doctorRegNo, item.quantity,
             item.batchNumber, req.user.userId, prescriptionUrl]
          );
        }

        // Save patient history for prescription medicines
        if (customerId && med.rows.length && med.rows[0].schedule_type !== 'NONE') {
          await client.query(
            `INSERT INTO patient_history (customer_id,medicine_id,invoice_id,doctor_name,prescription_url,quantity) VALUES ($1,$2,$3,$4,$5,$6)`,
            [customerId, item.medicineId, invoice.invoice_id, doctorName, prescriptionUrl, item.quantity]
          );
        }
      }

      // Update customer balance if CREDIT
      if (paymentMode === 'CREDIT' && customerId) {
        await client.query('UPDATE customers SET current_balance=current_balance+$1 WHERE customer_id=$2', [totals.totalAmount, customerId]);
      }

      // Award loyalty points (1 point per 100 rupees)
      if (customerId) {
        const pointsEarned = Math.floor(totals.totalAmount / 100);
        if (pointsEarned > 0) {
          await client.query('UPDATE customers SET loyalty_points=loyalty_points+$1 WHERE customer_id=$2', [pointsEarned, customerId]);
          await client.query(
            `INSERT INTO loyalty_transactions (customer_id,store_id,invoice_id,points_earned,balance_after,description)
             SELECT $1,$2,$3,$4,loyalty_points,$5 FROM customers WHERE customer_id=$1`,
            [customerId, storeId, invoice.invoice_id, pointsEarned, `Earned on invoice ${invoiceNo}`]
          );
        }
      }

      await client.query('COMMIT');

      // Audit log
      await db.query(
        `INSERT INTO audit_log (store_id,user_id,action,entity_type,entity_id,new_value,ip_address) VALUES ($1,$2,'BILL_CREATED','INVOICE',$3,$4,$5)`,
        [storeId, req.user.userId, invoice.invoice_id, JSON.stringify({ invoiceNo, total: totals.totalAmount }), req.ip]
      );

      res.status(201).json({ ...invoice, items: totals.items, invoiceNo });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  // GET /api/billing/invoice/:id
  r.get('/invoice/:id', async (req, res) => {
    try {
      const inv = await db.query(
        `SELECT i.*, u.full_name AS billed_by_name, c.name AS customer_name, c.phone AS customer_phone, s.store_name, s.gstin, s.drug_license_no
         FROM invoices i LEFT JOIN users u ON i.billed_by=u.user_id LEFT JOIN customers c ON i.customer_id=c.customer_id
         LEFT JOIN stores s ON i.store_id=s.store_id WHERE i.invoice_id=$1`, [req.params.id]
      );
      if (!inv.rows.length) return res.status(404).json({ error: 'Not found' });
      const items = await db.query(
        `SELECT ii.*, m.brand_name, m.generic_name, m.medicine_form, m.strength, ib.batch_number, ib.expiry_date
         FROM invoice_items ii JOIN medicines m ON ii.medicine_id=m.medicine_id
         LEFT JOIN inventory_batches ib ON ii.batch_id=ib.batch_id
         WHERE ii.invoice_id=$1`, [req.params.id]
      );
      res.json({ ...inv.rows[0], items: items.rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/billing/invoices - List invoices for store
  r.get('/invoices', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const from = req.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
      const to = req.query.to || new Date().toISOString();
      const result = await db.query(
        `SELECT i.invoice_id, i.invoice_no, i.invoice_date, i.total_amount, i.payment_mode, i.is_cancelled,
                c.name AS customer_name, u.full_name AS billed_by_name
         FROM invoices i LEFT JOIN customers c ON i.customer_id=c.customer_id LEFT JOIN users u ON i.billed_by=u.user_id
         WHERE i.store_id=$1 AND i.invoice_date BETWEEN $2 AND $3
         ORDER BY i.invoice_date DESC LIMIT 500`,
        [storeId, from, to]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/billing/return - Sales return / credit note
  r.post('/return', async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { originalInvoiceId, items, reason, storeId: bodyStoreId } = req.body;
      const storeId = bodyStoreId || req.user.storeId;

      const cnNumber = await generateCNNumber(db, storeId);
      let totalAmount = 0;
      for (const item of items) { totalAmount += item.mrp * item.quantity; }

      const cn = await client.query(
        `INSERT INTO credit_notes (cn_number,store_id,original_invoice_id,cn_type,total_amount,status,notes,created_by)
         VALUES ($1,$2,$3,'CUSTOMER_RETURN',$4,'PENDING',$5,$6) RETURNING *`,
        [cnNumber, storeId, originalInvoiceId, totalAmount, reason, req.user.userId]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO credit_note_items (cn_id,medicine_id,batch_id,quantity,mrp,reason) VALUES ($1,$2,$3,$4,$5,$6)`,
          [cn.rows[0].cn_id, item.medicineId, item.batchId, item.quantity, item.mrp, item.reason || reason]
        );
        // Add stock back
        await client.query('UPDATE inventory_batches SET quantity_strips=quantity_strips+$1 WHERE batch_id=$2', [item.quantity, item.batchId]);
      }

      await client.query('COMMIT');
      res.status(201).json(cn.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // GET /api/billing/credit-notes
  r.get('/credit-notes', async (req, res) => {
    try {
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT cn.*, s.name AS supplier_name FROM credit_notes cn LEFT JOIN suppliers s ON cn.supplier_id=s.supplier_id
         WHERE cn.store_id=$1 ORDER BY cn.created_at DESC`, [storeId]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/billing/credit-notes/:id/status
  r.put('/credit-notes/:id/status', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { status } = req.body;
      const result = await db.query(
        `UPDATE credit_notes SET status=$1, closed_at=CASE WHEN $1='CLOSED' THEN NOW() ELSE closed_at END WHERE cn_id=$2 RETURNING *`,
        [status, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/billing/cancel/:id
  r.post('/cancel/:id', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const { reason } = req.body;
      await db.query(
        'UPDATE invoices SET is_cancelled=TRUE, cancel_reason=$1, cancelled_by=$2 WHERE invoice_id=$3',
        [reason, req.user.userId, req.params.id]
      );
      // Audit log
      await db.query(
        `INSERT INTO audit_log (store_id,user_id,action,entity_type,entity_id,new_value,ip_address) VALUES ($1,$2,'BILL_CANCELLED','INVOICE',$3,$4,$5)`,
        [req.user.storeId, req.user.userId, req.params.id, JSON.stringify({ reason }), req.ip]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
