CREATE INDEX IF NOT EXISTS idx_inventory_batches_sellable_store_medicine_expiry
    ON inventory_batches (store_id, medicine_id, expiry_date, created_at, batch_id)
    WHERE is_active = true
      AND upper(coalesce(inventory_state, 'SELLABLE')) = 'SELLABLE'
      AND (coalesce(quantity_strips, 0) > 0 OR coalesce(quantity_loose, 0) > 0);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_sellable_medicine_expiry
    ON inventory_batches (medicine_id, expiry_date, created_at, batch_id)
    WHERE is_active = true
      AND upper(coalesce(inventory_state, 'SELLABLE')) = 'SELLABLE'
      AND (coalesce(quantity_strips, 0) > 0 OR coalesce(quantity_loose, 0) > 0);
