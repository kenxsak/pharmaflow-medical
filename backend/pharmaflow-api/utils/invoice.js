// Generate Indian financial year invoice numbers
// Format: TN{STORE_CODE}/{FY}/{SEQUENTIAL}
// FY runs April to March in India

function getFinancialYear(date) {
  const d = date || new Date();
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();
  if (month >= 3) return `${year}-${(year + 1).toString().slice(2)}`;
  return `${year - 1}-${year.toString().slice(2)}`;
}

async function generateInvoiceNumber(db, storeId) {
  const fy = getFinancialYear();
  const result = await db.query(
    `INSERT INTO invoice_sequence (store_id, financial_year, last_number) VALUES ($1, $2, 1)
     ON CONFLICT (store_id, financial_year) DO UPDATE SET last_number = invoice_sequence.last_number + 1
     RETURNING last_number`,
    [storeId, fy]
  );
  const seq = result.rows[0].last_number;
  const storeResult = await db.query('SELECT store_code FROM stores WHERE store_id = $1', [storeId]);
  const code = storeResult.rows[0]?.store_code || 'TN';
  return `${code}/${fy}/${String(seq).padStart(5, '0')}`;
}

async function generatePONumber(db, storeId) {
  const fy = getFinancialYear();
  const storeResult = await db.query('SELECT store_code FROM stores WHERE store_id = $1', [storeId]);
  const code = storeResult.rows[0]?.store_code || 'TN';
  const count = await db.query('SELECT COUNT(*) FROM purchase_orders WHERE store_id = $1', [storeId]);
  const seq = parseInt(count.rows[0].count) + 1;
  return `PO-${code}/${fy}/${String(seq).padStart(5, '0')}`;
}

async function generateCNNumber(db, storeId) {
  const fy = getFinancialYear();
  const storeResult = await db.query('SELECT store_code FROM stores WHERE store_id = $1', [storeId]);
  const code = storeResult.rows[0]?.store_code || 'TN';
  const count = await db.query('SELECT COUNT(*) FROM credit_notes WHERE store_id = $1', [storeId]);
  const seq = parseInt(count.rows[0].count) + 1;
  return `CN-${code}/${fy}/${String(seq).padStart(5, '0')}`;
}

module.exports = { getFinancialYear, generateInvoiceNumber, generatePONumber, generateCNNumber };
