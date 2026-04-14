-- ============================================================
-- PHARMAFLOW - COMPLETE POSTGRESQL SCHEMA
-- India Pharmacy SaaS | Multi-Store | Tamil Nadu
-- All 43 features supported
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== 1. STORES ============================
CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_code VARCHAR(20) UNIQUE NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    store_type VARCHAR(20) NOT NULL CHECK (store_type IN ('STORE','WAREHOUSE','HO')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10),
    phone VARCHAR(15),
    email VARCHAR(200),
    gstin VARCHAR(20),
    drug_license_no VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================== 2. ROLES & USERS =====================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    can_edit_price BOOLEAN DEFAULT FALSE,
    can_edit_bills BOOLEAN DEFAULT FALSE,
    can_sell_schedule_h BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT FALSE,
    can_manage_inventory BOOLEAN DEFAULT FALSE
);

INSERT INTO roles (role_name, description, can_edit_price, can_edit_bills, can_sell_schedule_h, can_view_reports, can_manage_inventory) VALUES
('SUPER_ADMIN',     'Full access to all stores and HO',    TRUE, TRUE, TRUE, TRUE, TRUE),
('STORE_MANAGER',   'Full access to own store',            TRUE, TRUE, TRUE, TRUE, TRUE),
('PHARMACIST',      'Can bill + handle Schedule H drugs',  FALSE, FALSE, TRUE, TRUE, FALSE),
('SALES_ASSISTANT', 'Can bill only - no price edit',       FALSE, FALSE, FALSE, FALSE, FALSE),
('WAREHOUSE_MGR',   'Manage central warehouse stock',      FALSE, FALSE, FALSE, TRUE, TRUE),
('DELIVERY_BOY',    'Home delivery access only',           FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(200),
    role_id INT REFERENCES roles(role_id),
    pharmacist_reg_no VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================== 3. MEDICINE MASTER ===================
CREATE TABLE manufacturers (
    manufacturer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    short_code VARCHAR(20),
    address TEXT,
    gstin VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE salt_compositions (
    salt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salt_name VARCHAR(300) NOT NULL,
    generic_name VARCHAR(300),
    drug_class VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medicines (
    medicine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(300) NOT NULL,
    generic_name VARCHAR(300),
    salt_id UUID REFERENCES salt_compositions(salt_id),
    manufacturer_id UUID REFERENCES manufacturers(manufacturer_id),
    medicine_form VARCHAR(50),
    strength VARCHAR(100),
    pack_size INT DEFAULT 10,
    barcode VARCHAR(100),
    hsn_code VARCHAR(20),
    gst_rate DECIMAL(5,2) DEFAULT 12,
    mrp DECIMAL(10,2) NOT NULL,
    ptr DECIMAL(10,2),
    pts DECIMAL(10,2),
    schedule_type VARCHAR(20) DEFAULT 'NONE',
    is_narcotic BOOLEAN DEFAULT FALSE,
    is_psychotropic BOOLEAN DEFAULT FALSE,
    requires_rx BOOLEAN DEFAULT FALSE,
    reorder_level INT DEFAULT 10,
    pack_size_label VARCHAR(200),
    composition_summary TEXT,
    search_keywords TEXT,
    catalog_source VARCHAR(50) DEFAULT 'MANUAL',
    external_product_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_medicines_brand ON medicines(brand_name);
CREATE INDEX idx_medicines_generic ON medicines(generic_name);
CREATE INDEX idx_medicines_barcode ON medicines(barcode);
CREATE INDEX idx_medicines_schedule ON medicines(schedule_type);
CREATE INDEX idx_medicines_salt ON medicines(salt_id);
CREATE INDEX idx_medicines_catalog_external ON medicines(catalog_source, external_product_id);

CREATE TABLE medicine_substitutes (
    id SERIAL PRIMARY KEY,
    medicine_id UUID REFERENCES medicines(medicine_id),
    substitute_id UUID REFERENCES medicines(medicine_id),
    is_generic BOOLEAN DEFAULT FALSE,
    price_diff_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicine_substitute_pair
    ON medicine_substitutes(medicine_id, substitute_id);

-- ===================== 4. INVENTORY & BATCHES ===============
CREATE TABLE inventory_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    quantity_strips INT NOT NULL DEFAULT 0,
    quantity_loose INT NOT NULL DEFAULT 0,
    purchase_rate DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_batches_store ON inventory_batches(store_id);
CREATE INDEX idx_batches_medicine ON inventory_batches(medicine_id);
CREATE INDEX idx_batches_expiry ON inventory_batches(expiry_date);

-- FIFO view: oldest non-expired batch first
CREATE OR REPLACE VIEW inventory_fifo AS
SELECT
    ib.*,
    m.brand_name, m.generic_name, m.schedule_type, m.gst_rate, m.pack_size,
    mfr.name AS manufacturer_name,
    CASE
        WHEN ib.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRY_30'
        WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'EXPIRY_60'
        WHEN ib.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRY_90'
        ELSE 'OK'
    END AS expiry_status
FROM inventory_batches ib
JOIN medicines m ON ib.medicine_id = m.medicine_id
LEFT JOIN manufacturers mfr ON m.manufacturer_id = mfr.manufacturer_id
WHERE ib.is_active = TRUE
ORDER BY ib.expiry_date ASC;

-- Stock transfers between stores
CREATE TABLE stock_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_store_id UUID REFERENCES stores(store_id),
    to_store_id UUID REFERENCES stores(store_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_id UUID REFERENCES inventory_batches(batch_id),
    quantity_strips INT NOT NULL,
    quantity_loose INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_TRANSIT','RECEIVED','CANCELLED')),
    requested_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ===================== 5. CUSTOMERS & LOYALTY ===============
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(200),
    address TEXT,
    doctor_name VARCHAR(200),
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
    txn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(customer_id),
    store_id UUID REFERENCES stores(store_id),
    invoice_id UUID,
    points_earned INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    balance_after INT NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient history for prescription medicines
CREATE TABLE patient_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(customer_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    invoice_id UUID,
    doctor_name VARCHAR(200),
    doctor_reg_no VARCHAR(50),
    prescription_url TEXT,
    quantity DECIMAL(10,3),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================== 6. GST BILLING & INVOICES ============
CREATE TABLE invoice_sequence (
    store_id UUID REFERENCES stores(store_id),
    financial_year VARCHAR(10) NOT NULL,
    last_number INT DEFAULT 0,
    PRIMARY KEY (store_id, financial_year)
);

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    store_id UUID REFERENCES stores(store_id),
    customer_id UUID REFERENCES customers(customer_id),
    billed_by UUID REFERENCES users(user_id),
    invoice_date TIMESTAMP DEFAULT NOW(),
    invoice_type VARCHAR(20) DEFAULT 'SALE' CHECK (invoice_type IN ('SALE','RETURN','CREDIT_NOTE')),
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    taxable_amount DECIMAL(12,2) NOT NULL,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    round_off DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(20),
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) DEFAULT 0,
    prescription_attached BOOLEAN DEFAULT FALSE,
    prescription_url TEXT,
    doctor_name VARCHAR(200),
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancel_reason TEXT,
    cancelled_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_store ON invoices(store_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

CREATE TABLE invoice_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(invoice_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_id UUID REFERENCES inventory_batches(batch_id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'STRIP',
    mrp DECIMAL(10,2) NOT NULL,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    taxable_amount DECIMAL(12,2) NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    cgst DECIMAL(10,2) DEFAULT 0,
    sgst DECIMAL(10,2) DEFAULT 0,
    igst DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL
);

-- ===================== 7. CREDIT NOTES (Vendor Returns) =====
CREATE TABLE credit_notes (
    cn_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cn_number VARCHAR(50) UNIQUE NOT NULL,
    store_id UUID REFERENCES stores(store_id),
    supplier_id UUID,
    original_invoice_id UUID REFERENCES invoices(invoice_id),
    cn_type VARCHAR(20) DEFAULT 'VENDOR_RETURN' CHECK (cn_type IN ('VENDOR_RETURN','CUSTOMER_RETURN','EXPIRY_RETURN')),
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT_TO_SUPPLIER','CREDIT_RECEIVED','CLOSED')),
    notes TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE credit_note_items (
    cn_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cn_id UUID REFERENCES credit_notes(cn_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_id UUID REFERENCES inventory_batches(batch_id),
    quantity DECIMAL(10,3) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    reason VARCHAR(200)
);

-- ===================== 8. SCHEDULE H/H1/NARCOTIC ============
CREATE TABLE schedule_drug_register (
    register_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    invoice_id UUID REFERENCES invoices(invoice_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    schedule_type VARCHAR(20) NOT NULL,
    sale_date TIMESTAMP DEFAULT NOW(),
    patient_name VARCHAR(200) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(10),
    patient_address TEXT,
    doctor_name VARCHAR(200) NOT NULL,
    doctor_reg_no VARCHAR(50),
    quantity_sold DECIMAL(10,3) NOT NULL,
    batch_number VARCHAR(100),
    pharmacist_id UUID REFERENCES users(user_id),
    prescription_url TEXT,
    remarks TEXT
);

CREATE INDEX idx_schedule_store ON schedule_drug_register(store_id);
CREATE INDEX idx_schedule_type ON schedule_drug_register(schedule_type);
CREATE INDEX idx_schedule_date ON schedule_drug_register(sale_date);

-- ===================== 9. SUPPLIERS & PURCHASES =============
CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact VARCHAR(200),
    phone VARCHAR(15),
    email VARCHAR(200),
    gstin VARCHAR(20),
    drug_license VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    supplier_id UUID REFERENCES suppliers(supplier_id),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    po_date TIMESTAMP DEFAULT NOW(),
    invoice_number VARCHAR(100),
    subtotal DECIMAL(12,2),
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','RECEIVED','PARTIAL','CANCELLED')),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    po_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID REFERENCES purchase_orders(po_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    free_qty INT DEFAULT 0,
    purchase_rate DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2)
);

-- Purchase schemes (Buy 10 Get 1 etc)
CREATE TABLE purchase_schemes (
    scheme_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(supplier_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    buy_qty INT NOT NULL,
    free_qty INT NOT NULL,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================== 10. HOME DELIVERY ====================
CREATE TABLE delivery_orders (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(invoice_id),
    store_id UUID REFERENCES stores(store_id),
    customer_id UUID REFERENCES customers(customer_id),
    delivery_boy_id UUID REFERENCES users(user_id),
    delivery_address TEXT NOT NULL,
    delivery_phone VARCHAR(15),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
    amount_to_collect DECIMAL(12,2) DEFAULT 0,
    amount_collected DECIMAL(12,2) DEFAULT 0,
    payment_mode VARCHAR(20),
    notes TEXT,
    assigned_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===================== 11. AUDIT LOG ========================
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_store ON audit_log(store_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ===================== 12. SAAS TENANCY ====================
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    brand_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    brand_tagline VARCHAR(300),
    support_email VARCHAR(200),
    support_phone VARCHAR(30),
    billing_email VARCHAR(200),
    gstin VARCHAR(20),
    deployment_mode VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    licensed_store_count INT DEFAULT 0,
    licensed_user_count INT DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(tenant_id),
    ADD COLUMN IF NOT EXISTS license_expiry DATE,
    ADD COLUMN IF NOT EXISTS is_24hr BOOLEAN DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(tenant_id),
    ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

CREATE TABLE subscription_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    best_for VARCHAR(300),
    monthly_price_inr DECIMAL(12,2) DEFAULT 0,
    annual_price_inr DECIMAL(12,2) DEFAULT 0,
    onboarding_fee_inr DECIMAL(12,2) DEFAULT 0,
    per_store_overage_inr DECIMAL(12,2) DEFAULT 0,
    per_user_overage_inr DECIMAL(12,2) DEFAULT 0,
    max_stores INT DEFAULT 0,
    max_users INT DEFAULT 0,
    support_tier VARCHAR(30) NOT NULL DEFAULT 'BUSINESS_HOURS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscription_plan_features (
    plan_id UUID REFERENCES subscription_plans(plan_id) ON DELETE CASCADE,
    feature_code VARCHAR(80) NOT NULL,
    PRIMARY KEY (plan_id, feature_code)
);

CREATE TABLE tenant_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    start_date DATE,
    renewal_date DATE,
    trial_ends_on DATE,
    monthly_recurring_revenue_inr DECIMAL(12,2) DEFAULT 0,
    annual_contract_value_inr DECIMAL(12,2) DEFAULT 0,
    stores_included INT DEFAULT 0,
    users_included INT DEFAULT 0,
    overage_store_price_inr DECIMAL(12,2) DEFAULT 0,
    overage_user_price_inr DECIMAL(12,2) DEFAULT 0,
    auto_renew BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id, created_at DESC);

CREATE TABLE tenant_feature_overrides (
    override_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    feature_code VARCHAR(80) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    override_reason VARCHAR(400),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (tenant_id, feature_code)
);
