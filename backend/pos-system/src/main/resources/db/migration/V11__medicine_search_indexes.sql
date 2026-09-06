CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes for fast ILIKE pattern matching across 254k records
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name_trgm
    ON medicines USING gin (brand_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_generic_name_trgm
    ON medicines USING gin (generic_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medicines_search_keywords_trgm
    ON medicines USING gin (search_keywords gin_trgm_ops);

-- Btree indexes for barcode and active brand filtering
CREATE INDEX IF NOT EXISTS idx_medicines_barcode_btree
    ON medicines (barcode);

CREATE INDEX IF NOT EXISTS idx_medicines_active_brand
    ON medicines (is_active, brand_name);
