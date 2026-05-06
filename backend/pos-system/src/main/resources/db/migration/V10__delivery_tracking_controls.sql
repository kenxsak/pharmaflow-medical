ALTER TABLE delivery_orders
    ADD COLUMN IF NOT EXISTS pickup_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS out_for_delivery_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS current_latitude numeric(10,7),
    ADD COLUMN IF NOT EXISTS current_longitude numeric(10,7),
    ADD COLUMN IF NOT EXISTS last_location_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS last_location_label varchar(255);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_store_status_created
    ON delivery_orders (store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_boy
    ON delivery_orders (delivery_boy_id);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_invoice
    ON delivery_orders (invoice_id);
