ALTER TABLE inventory_batches
    ADD COLUMN IF NOT EXISTS inventory_state VARCHAR(30);

UPDATE inventory_batches
SET inventory_state = 'SELLABLE'
WHERE inventory_state IS NULL;

ALTER TABLE inventory_batches
    ALTER COLUMN inventory_state SET DEFAULT 'SELLABLE';

ALTER TABLE inventory_batches
    ALTER COLUMN inventory_state SET NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(store_id),
    batch_id UUID REFERENCES inventory_batches(batch_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    actor_id UUID REFERENCES users(user_id),
    movement_type VARCHAR(40) NOT NULL,
    reference_type VARCHAR(40),
    reference_id VARCHAR(100),
    reason_code VARCHAR(60),
    notes VARCHAR(500),
    quantity_strips_delta INTEGER NOT NULL DEFAULT 0,
    quantity_loose_delta INTEGER NOT NULL DEFAULT 0,
    quantity_strips_after INTEGER NOT NULL DEFAULT 0,
    quantity_loose_after INTEGER NOT NULL DEFAULT 0,
    inventory_state_after VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_created
    ON inventory_movements(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_batch_created
    ON inventory_movements(batch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference
    ON inventory_movements(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS sales_returns (
    return_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(50) NOT NULL UNIQUE,
    store_id UUID REFERENCES stores(store_id),
    invoice_id UUID REFERENCES invoices(invoice_id),
    customer_id UUID REFERENCES customers(customer_id),
    settlement_type VARCHAR(30) NOT NULL DEFAULT 'REFUND',
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes VARCHAR(500),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_return_items (
    return_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES sales_returns(return_id) ON DELETE CASCADE,
    invoice_item_id UUID REFERENCES invoice_items(item_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    batch_id UUID REFERENCES inventory_batches(batch_id),
    quantity NUMERIC(10,3) NOT NULL,
    unit_type VARCHAR(20),
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    reason VARCHAR(200)
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_invoice_created
    ON sales_returns(invoice_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_return_items_invoice_item
    ON sales_return_items(invoice_item_id);

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS claim_state VARCHAR(20);

UPDATE credit_notes
SET claim_state = COALESCE(claim_state, status, 'PENDING');

ALTER TABLE credit_notes
    ALTER COLUMN claim_state SET DEFAULT 'PENDING';

ALTER TABLE credit_notes
    ALTER COLUMN claim_state SET NOT NULL;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS claim_amount NUMERIC(12,2);

UPDATE credit_notes
SET claim_amount = COALESCE(claim_amount, total_amount, 0);

ALTER TABLE credit_notes
    ALTER COLUMN claim_amount SET DEFAULT 0;

ALTER TABLE credit_notes
    ALTER COLUMN claim_amount SET NOT NULL;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS settled_amount NUMERIC(12,2);

UPDATE credit_notes
SET settled_amount = COALESCE(settled_amount, 0);

ALTER TABLE credit_notes
    ALTER COLUMN settled_amount SET DEFAULT 0;

ALTER TABLE credit_notes
    ALTER COLUMN settled_amount SET NOT NULL;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

ALTER TABLE credit_notes
    ADD COLUMN IF NOT EXISTS resolution_notes VARCHAR(500);

ALTER TABLE credit_note_items
    ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20);

UPDATE credit_note_items
SET unit_type = COALESCE(unit_type, 'STRIP');

ALTER TABLE credit_note_items
    ALTER COLUMN unit_type SET DEFAULT 'STRIP';

ALTER TABLE credit_note_items
    ALTER COLUMN unit_type SET NOT NULL;
