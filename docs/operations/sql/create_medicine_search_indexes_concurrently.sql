-- Run this manually after the backend is live and the database is stable.
-- Do not put these statements in a transactional Flyway migration: concurrent
-- index builds must run outside a transaction and can take time on large catalogs.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_brand_trgm
    ON medicines USING gin (lower(coalesce(brand_name, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_generic_trgm
    ON medicines USING gin (lower(coalesce(generic_name, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_barcode_trgm
    ON medicines USING gin (lower(coalesce(barcode, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_composition_trgm
    ON medicines USING gin (lower(coalesce(composition_summary, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_search_keywords_trgm
    ON medicines USING gin (lower(coalesce(search_keywords, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salt_compositions_name_trgm
    ON salt_compositions USING gin (lower(coalesce(salt_name, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manufacturers_name_trgm
    ON manufacturers USING gin (lower(coalesce(name, '')) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_batches_current_sellable_store
    ON inventory_batches (store_id, medicine_id, expiry_date, created_at, batch_id)
    WHERE is_active = true
      AND upper(coalesce(inventory_state, 'SELLABLE')) = 'SELLABLE'
      AND (coalesce(quantity_strips, 0) > 0 OR coalesce(quantity_loose, 0) > 0);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_batches_current_sellable_catalog
    ON inventory_batches (medicine_id, expiry_date, created_at, batch_id)
    WHERE is_active = true
      AND upper(coalesce(inventory_state, 'SELLABLE')) = 'SELLABLE'
      AND (coalesce(quantity_strips, 0) > 0 OR coalesce(quantity_loose, 0) > 0);
