const { Router } = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = function (db) {
  const r = Router();
  r.use(authMiddleware);

  // GET /api/medicines/search?q=paracetamol - Search by brand, generic, salt, barcode
  r.get('/search', async (req, res) => {
    try {
      const q = `%${req.query.q || ''}%`;
      const storeId = req.query.storeId || req.user.storeId;
      const result = await db.query(
        `SELECT m.*, sc.salt_name, sc.drug_class, mfr.name AS manufacturer_name,
         (SELECT json_agg(json_build_object('batchId',ib.batch_id,'batchNumber',ib.batch_number,'expiryDate',ib.expiry_date,
          'quantityStrips',ib.quantity_strips,'quantityLoose',ib.quantity_loose,'mrp',ib.mrp,'purchaseRate',ib.purchase_rate))
          FROM inventory_batches ib WHERE ib.medicine_id=m.medicine_id AND ib.store_id=$3
          AND ib.is_active=TRUE AND ib.expiry_date>CURRENT_DATE AND (ib.quantity_strips>0 OR ib.quantity_loose>0)
          ORDER BY ib.expiry_date ASC) AS batches
         FROM medicines m
         LEFT JOIN salt_compositions sc ON m.salt_id=sc.salt_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE m.is_active=TRUE AND (
           m.brand_name ILIKE $1 OR m.generic_name ILIKE $1 OR sc.salt_name ILIKE $2
           OR m.barcode=$4 OR sc.generic_name ILIKE $1
         ) ORDER BY m.brand_name LIMIT 20`,
        [q, q, storeId, req.query.q]
      );
      // Attach first FIFO batch as currentBatch
      const medicines = result.rows.map(m => ({
        ...m, currentBatch: m.batches?.[0] || null,
        totalStock: m.batches?.reduce((s, b) => s + b.quantityStrips, 0) || 0
      }));
      res.json(medicines);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/medicines/:id
  r.get('/:id', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT m.*, sc.salt_name, sc.drug_class, mfr.name AS manufacturer_name
         FROM medicines m LEFT JOIN salt_compositions sc ON m.salt_id=sc.salt_id
         LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE m.medicine_id=$1`, [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/medicines/:id/substitutes - Salt-to-brand substitutes
  r.get('/:id/substitutes', async (req, res) => {
    try {
      // Find medicines with same salt_id
      const med = await db.query('SELECT salt_id, mrp FROM medicines WHERE medicine_id=$1', [req.params.id]);
      if (!med.rows.length) return res.status(404).json({ error: 'Not found' });
      const result = await db.query(
        `SELECT m.medicine_id, m.brand_name, m.generic_name, m.mrp, m.medicine_form, m.strength,
                mfr.name AS manufacturer_name,
                ROUND((($2 - m.mrp) / $2 * 100)::numeric, 1) AS price_diff_pct
         FROM medicines m LEFT JOIN manufacturers mfr ON m.manufacturer_id=mfr.manufacturer_id
         WHERE m.salt_id=$1 AND m.medicine_id!=$3 AND m.is_active=TRUE ORDER BY m.mrp`,
        [med.rows[0].salt_id, med.rows[0].mrp, req.params.id]
      );
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/medicines - Create medicine (admin/manager)
  r.post('/', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const b = req.body;
      const result = await db.query(
        `INSERT INTO medicines (brand_name,generic_name,salt_id,manufacturer_id,medicine_form,strength,pack_size,barcode,hsn_code,gst_rate,mrp,ptr,pts,schedule_type,is_narcotic,is_psychotropic,requires_rx,reorder_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [b.brandName, b.genericName, b.saltId, b.manufacturerId, b.medicineForm, b.strength, b.packSize || 10,
         b.barcode, b.hsnCode || '3004', b.gstRate || 12, b.mrp, b.ptr, b.pts,
         b.scheduleType || 'NONE', b.isNarcotic || false, b.isPsychotropic || false, b.requiresRx || false, b.reorderLevel || 10]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/medicines/:id - Update medicine
  r.put('/:id', requireRole('SUPER_ADMIN', 'STORE_MANAGER'), async (req, res) => {
    try {
      const b = req.body;
      // Audit: log old value
      const old = await db.query('SELECT mrp, ptr, pts FROM medicines WHERE medicine_id=$1', [req.params.id]);
      const result = await db.query(
        `UPDATE medicines SET brand_name=COALESCE($2,brand_name), generic_name=COALESCE($3,generic_name),
         mrp=COALESCE($4,mrp), ptr=COALESCE($5,ptr), pts=COALESCE($6,pts), gst_rate=COALESCE($7,gst_rate),
         schedule_type=COALESCE($8,schedule_type), reorder_level=COALESCE($9,reorder_level),
         is_active=COALESCE($10,is_active)
         WHERE medicine_id=$1 RETURNING *`,
        [req.params.id, b.brandName, b.genericName, b.mrp, b.ptr, b.pts, b.gstRate, b.scheduleType, b.reorderLevel, b.isActive]
      );
      // Log price change
      if (b.mrp && old.rows[0] && +old.rows[0].mrp !== +b.mrp) {
        await db.query(
          `INSERT INTO audit_log (store_id,user_id,action,entity_type,entity_id,old_value,new_value,ip_address)
           VALUES ($1,$2,'PRICE_EDITED','MEDICINE',$3,$4,$5,$6)`,
          [req.user.storeId, req.user.userId, req.params.id, JSON.stringify(old.rows[0]), JSON.stringify({ mrp: b.mrp, ptr: b.ptr, pts: b.pts }), req.ip]
        );
      }
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/medicines/manufacturers/list
  r.get('/manufacturers/list', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM manufacturers WHERE is_active=TRUE ORDER BY name');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/medicines/salts/list
  r.get('/salts/list', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM salt_compositions ORDER BY salt_name');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return r;
};
