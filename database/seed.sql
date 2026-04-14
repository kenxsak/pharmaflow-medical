-- ============================================================
-- PHARMAFLOW SEED DATA
-- Stores, Users, Medicines, Inventory, Customers
-- ============================================================

-- Stores
INSERT INTO stores (store_code, store_name, store_type, city, state, gstin, drug_license_no) VALUES
('TN-HO-000',    'PharmaFlow Head Office',      'HO',        'Chennai',    'Tamil Nadu', '33AABCP1234A1Z5', 'TN-DL-HO-001'),
('TN-WH-000',    'PharmaFlow Central Warehouse', 'WAREHOUSE', 'Chennai',    'Tamil Nadu', '33AABCP1234A1Z5', 'TN-DL-WH-001'),
('TN-STORE-001', 'PharmaFlow - Anna Nagar',      'STORE',     'Chennai',    'Tamil Nadu', '33AABCP1234A1Z5', 'TN-DL-001'),
('TN-STORE-002', 'PharmaFlow - T.Nagar',         'STORE',     'Chennai',    'Tamil Nadu', '33AABCP1234A1Z6', 'TN-DL-002'),
('TN-STORE-003', 'PharmaFlow - Coimbatore',      'STORE',     'Coimbatore', 'Tamil Nadu', '33AABCP1234A1Z7', 'TN-DL-003')
ON CONFLICT (store_code) DO NOTHING;

-- Users (password = 'pharma123' bcrypt hashed)
INSERT INTO users (store_id, username, password_hash, full_name, phone, role_id, pharmacist_reg_no)
SELECT s.store_id, 'admin', '$2b$10$rQZ8kHwVlWZQwOe7Q5b5aeAzFcRcVjGHnMhQKzVxZGJvYjZLm9Wau', 'Super Admin', '9876543210', 1, NULL
FROM stores s WHERE s.store_code = 'TN-HO-000'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (store_id, username, password_hash, full_name, phone, role_id, pharmacist_reg_no)
SELECT s.store_id, 'pharmacist1', '$2b$10$rQZ8kHwVlWZQwOe7Q5b5aeAzFcRcVjGHnMhQKzVxZGJvYjZLm9Wau', 'Dr. Priya Kumar', '9876543211', 3, 'TN-PH-2024-001'
FROM stores s WHERE s.store_code = 'TN-STORE-001'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (store_id, username, password_hash, full_name, phone, role_id, pharmacist_reg_no)
SELECT s.store_id, 'sales1', '$2b$10$rQZ8kHwVlWZQwOe7Q5b5aeAzFcRcVjGHnMhQKzVxZGJvYjZLm9Wau', 'Raj Sharma', '9876543212', 4, NULL
FROM stores s WHERE s.store_code = 'TN-STORE-001'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (store_id, username, password_hash, full_name, phone, role_id, pharmacist_reg_no)
SELECT s.store_id, 'manager1', '$2b$10$rQZ8kHwVlWZQwOe7Q5b5aeAzFcRcVjGHnMhQKzVxZGJvYjZLm9Wau', 'Anitha Rajan', '9876543213', 2, NULL
FROM stores s WHERE s.store_code = 'TN-STORE-001'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (store_id, username, password_hash, full_name, phone, role_id, pharmacist_reg_no)
SELECT s.store_id, 'delivery1', '$2b$10$rQZ8kHwVlWZQwOe7Q5b5aeAzFcRcVjGHnMhQKzVxZGJvYjZLm9Wau', 'Kumar Delivery', '9876543214', 6, NULL
FROM stores s WHERE s.store_code = 'TN-STORE-001'
ON CONFLICT (username) DO NOTHING;

-- Manufacturers
INSERT INTO manufacturers (name, short_code) VALUES
('Sun Pharma Industries Ltd', 'SUN'),
('Cipla Ltd', 'CIPLA'),
('Dr. Reddys Laboratories', 'DRL'),
('Mankind Pharma Ltd', 'MANKIND'),
('Alkem Laboratories Ltd', 'ALKEM'),
('Lupin Ltd', 'LUPIN'),
('Abbott India Ltd', 'ABBOTT'),
('Zydus Cadila', 'ZYDUS'),
('Torrent Pharmaceuticals', 'TORRENT'),
('Micro Labs Ltd', 'MICRO'),
('GSK India', 'GSK'),
('Pfizer India', 'PFIZER'),
('Intas Pharmaceuticals', 'INTAS'),
('Cadila Healthcare', 'CADILA'),
('Glenmark Pharma', 'GLENMARK');

-- Salt Compositions
INSERT INTO salt_compositions (salt_name, generic_name, drug_class) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Analgesic/Antipyretic'),
('Paracetamol 650mg', 'Paracetamol', 'Analgesic/Antipyretic'),
('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic'),
('Azithromycin 500mg', 'Azithromycin', 'Antibiotic'),
('Metformin 500mg', 'Metformin', 'Antidiabetic'),
('Metformin 1000mg', 'Metformin', 'Antidiabetic'),
('Atorvastatin 10mg', 'Atorvastatin', 'Statin'),
('Amlodipine 5mg', 'Amlodipine', 'Antihypertensive'),
('Omeprazole 20mg', 'Omeprazole', 'Proton Pump Inhibitor'),
('Pantoprazole 40mg', 'Pantoprazole', 'Proton Pump Inhibitor'),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine'),
('Alprazolam 0.25mg', 'Alprazolam', 'Benzodiazepine'),
('Codeine Phosphate 30mg', 'Codeine', 'Narcotic Analgesic'),
('Tramadol 50mg', 'Tramadol', 'Opioid Analgesic'),
('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Antibiotic'),
('Diclofenac 50mg', 'Diclofenac', 'NSAID'),
('Ranitidine 150mg', 'Ranitidine', 'H2 Blocker'),
('Losartan 50mg', 'Losartan', 'Antihypertensive'),
('Clopidogrel 75mg', 'Clopidogrel', 'Antiplatelet'),
('Montelukast 10mg', 'Montelukast', 'Leukotriene Antagonist');

-- Medicines (with manufacturer and salt references done via subquery)
INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Crocin 500', 'Paracetamol', sc.salt_id, mfr.manufacturer_id, 'TABLET', '500mg', 10, '3004', 12, 25.50, 18.00, 16.00, 'NONE', FALSE, FALSE, '8901234500001', 20
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Paracetamol 500mg' AND mfr.short_code='GSK';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Dolo 650', 'Paracetamol', sc.salt_id, mfr.manufacturer_id, 'TABLET', '650mg', 15, '3004', 12, 32.00, 22.00, 19.50, 'NONE', FALSE, FALSE, '8901234500002', 30
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Paracetamol 650mg' AND mfr.short_code='MICRO';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Mox 500', 'Amoxicillin', sc.salt_id, mfr.manufacturer_id, 'CAPSULE', '500mg', 10, '3004', 12, 85.00, 60.00, 52.00, 'H', FALSE, TRUE, '8901234500003', 15
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Amoxicillin 500mg' AND mfr.short_code='CIPLA';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Azithral 500', 'Azithromycin', sc.salt_id, mfr.manufacturer_id, 'TABLET', '500mg', 3, '3004', 12, 98.00, 70.00, 62.00, 'H', FALSE, TRUE, '8901234500004', 10
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Azithromycin 500mg' AND mfr.short_code='ALKEM';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Glycomet 500', 'Metformin', sc.salt_id, mfr.manufacturer_id, 'TABLET', '500mg', 10, '3004', 12, 35.00, 24.00, 21.00, 'NONE', FALSE, TRUE, '8901234500005', 25
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Metformin 500mg' AND mfr.short_code='SUN';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Atorva 10', 'Atorvastatin', sc.salt_id, mfr.manufacturer_id, 'TABLET', '10mg', 10, '3004', 12, 120.00, 85.00, 75.00, 'NONE', FALSE, TRUE, '8901234500006', 15
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Atorvastatin 10mg' AND mfr.short_code='ZYDUS';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Amlip 5', 'Amlodipine', sc.salt_id, mfr.manufacturer_id, 'TABLET', '5mg', 10, '3004', 12, 42.00, 30.00, 26.00, 'NONE', FALSE, TRUE, '8901234500007', 20
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Amlodipine 5mg' AND mfr.short_code='CIPLA';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Pan 40', 'Pantoprazole', sc.salt_id, mfr.manufacturer_id, 'TABLET', '40mg', 10, '3004', 12, 65.00, 46.00, 40.00, 'NONE', FALSE, FALSE, '8901234500008', 20
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Pantoprazole 40mg' AND mfr.short_code='ALKEM';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Alerid', 'Cetirizine', sc.salt_id, mfr.manufacturer_id, 'TABLET', '10mg', 10, '3004', 12, 28.00, 20.00, 17.00, 'NONE', FALSE, FALSE, '8901234500009', 25
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Cetirizine 10mg' AND mfr.short_code='CIPLA';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Alprax 0.25', 'Alprazolam', sc.salt_id, mfr.manufacturer_id, 'TABLET', '0.25mg', 10, '3004', 12, 35.00, 24.00, 21.00, 'H1', FALSE, TRUE, '8901234500010', 10
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Alprazolam 0.25mg' AND mfr.short_code='TORRENT';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Codeine Tab', 'Codeine', sc.salt_id, mfr.manufacturer_id, 'TABLET', '30mg', 10, '3004', 12, 150.00, 105.00, 92.00, 'X', TRUE, TRUE, '8901234500011', 5
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Codeine Phosphate 30mg' AND mfr.short_code='ABBOTT';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Tramazac', 'Tramadol', sc.salt_id, mfr.manufacturer_id, 'CAPSULE', '50mg', 10, '3004', 12, 55.00, 38.00, 33.00, 'H1', FALSE, TRUE, '8901234500012', 10
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Tramadol 50mg' AND mfr.short_code='ZYDUS';

-- Generic substitutes for Paracetamol
INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Paracip 500', 'Paracetamol', sc.salt_id, mfr.manufacturer_id, 'TABLET', '500mg', 10, '3004', 12, 15.00, 10.00, 8.50, 'NONE', FALSE, FALSE, '8901234500013', 20
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Paracetamol 500mg' AND mfr.short_code='CIPLA';

INSERT INTO medicines (brand_name, generic_name, salt_id, manufacturer_id, medicine_form, strength, pack_size, hsn_code, gst_rate, mrp, ptr, pts, schedule_type, is_narcotic, requires_rx, barcode, reorder_level)
SELECT 'Calpol 500', 'Paracetamol', sc.salt_id, mfr.manufacturer_id, 'TABLET', '500mg', 10, '3004', 12, 22.00, 15.50, 13.50, 'NONE', FALSE, FALSE, '8901234500014', 20
FROM salt_compositions sc, manufacturers mfr WHERE sc.salt_name='Paracetamol 500mg' AND mfr.short_code='GSK';

-- Inventory batches for TN-STORE-001
INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-001', '2024-01-15', '2026-01-15', 100, 0, 18.00, 25.50
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Crocin 500';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-002', '2024-03-01', '2026-03-01', 80, 5, 22.00, 32.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Dolo 650';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-003', '2024-02-10', '2025-08-10', 50, 0, 60.00, 85.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Mox 500';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-004', '2024-04-05', '2025-04-05', 30, 0, 70.00, 98.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Azithral 500';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-005', '2024-01-20', '2026-06-20', 200, 0, 24.00, 35.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Glycomet 500';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-006', '2024-02-15', '2026-02-15', 60, 0, 85.00, 120.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Atorva 10';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-007', '2024-03-10', '2026-09-10', 150, 0, 30.00, 42.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Amlip 5';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-008', '2024-01-05', '2026-07-05', 120, 0, 46.00, 65.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Pan 40';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-009', '2024-04-01', '2026-10-01', 180, 0, 20.00, 28.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Alerid';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-010', '2024-02-20', '2025-05-20', 25, 0, 24.00, 35.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Alprax 0.25';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-011', '2024-01-10', '2025-07-10', 10, 0, 105.00, 150.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Codeine Tab';

INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-2024-012', '2024-03-15', '2025-09-15', 40, 0, 38.00, 55.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Tramazac';

-- Near-expiry batch (for testing expiry alerts)
INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-OLD-001', '2023-01-01', '2026-05-01', 15, 3, 17.00, 25.50
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Crocin 500';

-- Low stock batch (for testing shortage alerts)
INSERT INTO inventory_batches (store_id, medicine_id, batch_number, manufacture_date, expiry_date, quantity_strips, quantity_loose, purchase_rate, mrp)
SELECT s.store_id, m.medicine_id, 'BT-LOW-001', '2024-06-01', '2027-06-01', 3, 0, 60.00, 85.00
FROM stores s, medicines m WHERE s.store_code='TN-STORE-001' AND m.brand_name='Mox 500';

-- Sample customers
INSERT INTO customers (store_id, name, phone, address, doctor_name, credit_limit, loyalty_points)
SELECT s.store_id, 'Ramesh Kumar', '9876000001', '12 Gandhi Street, Anna Nagar, Chennai', 'Dr. Venkat', 5000.00, 150
FROM stores s WHERE s.store_code='TN-STORE-001';

INSERT INTO customers (store_id, name, phone, address, doctor_name, credit_limit, loyalty_points)
SELECT s.store_id, 'Lakshmi Devi', '9876000002', '45 Nehru Road, T.Nagar, Chennai', 'Dr. Sundari', 10000.00, 320
FROM stores s WHERE s.store_code='TN-STORE-001';

INSERT INTO customers (store_id, name, phone, address, doctor_name, credit_limit, loyalty_points)
SELECT s.store_id, 'Mohammed Ali', '9876000003', '78 Mount Road, Chennai', 'Dr. Rahim', 3000.00, 80
FROM stores s WHERE s.store_code='TN-STORE-001';

-- Sample suppliers
INSERT INTO suppliers (name, contact, phone, email, gstin, drug_license, address) VALUES
('MedPlus Distributors',   'Suresh',  '9800000001', 'suresh@medplus.in',   '33AABCD1234E1Z5', 'TN-WD-001', 'Chennai'),
('PharmaCare Supply',      'Deepak',  '9800000002', 'deepak@pharmacare.in','33AABCE1234F1Z5', 'TN-WD-002', 'Coimbatore'),
('HealthLine Distributors','Kavitha', '9800000003', 'kavitha@healthline.in','33AABCF1234G1Z5', 'TN-WD-003', 'Madurai'),
('Apollo Pharma Supply',   'Rajan',   '9800000004', 'rajan@apollosupply.in','33AABCG1234H1Z5', 'TN-WD-004', 'Chennai');

-- Initialize invoice sequence for stores
INSERT INTO invoice_sequence (store_id, financial_year, last_number)
SELECT store_id, '2025-26', 0 FROM stores WHERE store_type = 'STORE';
