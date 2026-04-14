\set ON_ERROR_STOP on

\echo 'Preparing PharmaFlow medicine catalogue for dataset import...'

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_size_label VARCHAR(200);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS composition_summary TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS search_keywords TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS catalog_source VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS external_product_id VARCHAR(100);
ALTER TABLE medicines ALTER COLUMN composition_summary TYPE TEXT;
ALTER TABLE medicines ALTER COLUMN search_keywords TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_medicines_salt ON medicines(salt_id);
CREATE INDEX IF NOT EXISTS idx_medicines_catalog_external ON medicines(catalog_source, external_product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_medicines_catalog_external
    ON medicines(catalog_source, external_product_id)
    WHERE external_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicine_substitute_pair
    ON medicine_substitutes(medicine_id, substitute_id);

DROP TABLE IF EXISTS medicine_import_stage;
DROP INDEX IF EXISTS idx_medicines_search_keywords_fts;

CREATE TEMP TABLE medicine_import_stage (
    source_id TEXT,
    name TEXT,
    raw_price TEXT,
    is_discontinued TEXT,
    manufacturer_name TEXT,
    type TEXT,
    pack_size_label TEXT,
    short_composition1 TEXT,
    short_composition2 TEXT,
    salt_composition TEXT,
    medicine_desc TEXT,
    side_effects TEXT,
    drug_interactions TEXT
);

\echo 'Loading updated Indian medicine CSV into staging table...'
\copy medicine_import_stage (source_id, name, raw_price, is_discontinued, manufacturer_name, type, pack_size_label, short_composition1, short_composition2, salt_composition, medicine_desc, side_effects, drug_interactions) FROM '/tmp/staging_indian_medicine_data.csv' WITH (FORMAT csv, HEADER true)

\echo 'Importing manufacturers...'
WITH normalized AS (
    SELECT DISTINCT LEFT(TRIM(manufacturer_name), 200) AS manufacturer_name
    FROM medicine_import_stage
    WHERE NULLIF(TRIM(manufacturer_name), '') IS NOT NULL
)
INSERT INTO manufacturers (manufacturer_id, name, short_code, is_active)
SELECT
    uuid_generate_v4(),
    manufacturer_name,
    UPPER(LEFT(REGEXP_REPLACE(manufacturer_name, '[^A-Za-z0-9]', '', 'g'), 20)),
    TRUE
FROM normalized n
WHERE NOT EXISTS (
    SELECT 1
    FROM manufacturers m
    WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(n.manufacturer_name))
);

\echo 'Importing salt compositions...'
WITH salts AS (
    SELECT DISTINCT LEFT(REGEXP_REPLACE(TRIM(short_composition1), '\s+', ' ', 'g'), 300) AS salt_name
    FROM medicine_import_stage
    WHERE NULLIF(TRIM(short_composition1), '') IS NOT NULL
    UNION
    SELECT DISTINCT LEFT(REGEXP_REPLACE(TRIM(short_composition2), '\s+', ' ', 'g'), 300) AS salt_name
    FROM medicine_import_stage
    WHERE NULLIF(TRIM(short_composition2), '') IS NOT NULL
    UNION
    SELECT DISTINCT LEFT(REGEXP_REPLACE(TRIM(SPLIT_PART(salt_composition, '+', 1)), '\s+', ' ', 'g'), 300) AS salt_name
    FROM medicine_import_stage
    WHERE NULLIF(TRIM(salt_composition), '') IS NOT NULL
),
normalized AS (
    SELECT
        salt_name,
        LEFT(TRIM(REGEXP_REPLACE(salt_name, '\s*\(.*$', '')), 300) AS generic_name
    FROM salts
    WHERE NULLIF(TRIM(salt_name), '') IS NOT NULL
)
INSERT INTO salt_compositions (salt_id, salt_name, generic_name, drug_class)
SELECT
    uuid_generate_v4(),
    salt_name,
    generic_name,
    'Allopathy'
FROM normalized n
WHERE NOT EXISTS (
    SELECT 1
    FROM salt_compositions s
    WHERE LOWER(TRIM(s.salt_name)) = LOWER(TRIM(n.salt_name))
);

\echo 'Importing medicines with salt-based composition metadata...'
\echo 'Removing previously imported JUNIORALIVE_GITHUB catalogue rows before reload...'
DELETE FROM medicine_substitutes
WHERE medicine_id IN (
    SELECT medicine_id FROM medicines WHERE catalog_source = 'JUNIORALIVE_GITHUB'
)
OR substitute_id IN (
    SELECT medicine_id FROM medicines WHERE catalog_source = 'JUNIORALIVE_GITHUB'
);

DELETE FROM medicines
WHERE catalog_source = 'JUNIORALIVE_GITHUB';

DROP TABLE IF EXISTS manufacturer_lookup;
CREATE TEMP TABLE manufacturer_lookup AS
SELECT DISTINCT ON (lookup_key)
    lookup_key,
    manufacturer_id
FROM (
    SELECT
        LOWER(TRIM(name)) AS lookup_key,
        manufacturer_id
    FROM manufacturers
    WHERE NULLIF(TRIM(name), '') IS NOT NULL
) source_lookup
ORDER BY lookup_key, manufacturer_id;

CREATE INDEX idx_manufacturer_lookup_key
    ON manufacturer_lookup(lookup_key);

DROP TABLE IF EXISTS salt_lookup;
CREATE TEMP TABLE salt_lookup AS
SELECT DISTINCT ON (lookup_key)
    lookup_key,
    salt_id
FROM (
    SELECT
        LOWER(TRIM(salt_name)) AS lookup_key,
        salt_id
    FROM salt_compositions
    WHERE NULLIF(TRIM(salt_name), '') IS NOT NULL
) source_lookup
ORDER BY lookup_key, salt_id;

CREATE INDEX idx_salt_lookup_key
    ON salt_lookup(lookup_key);

WITH normalized AS (
    SELECT
        NULLIF(TRIM(source_id), '') AS source_id,
        LEFT(TRIM(name), 300) AS brand_name,
        NULLIF(LEFT(TRIM(manufacturer_name), 200), '') AS manufacturer_name,
        LOWER(COALESCE(NULLIF(TRIM(type), ''), 'allopathy')) AS medicine_type,
        NULLIF(LEFT(TRIM(pack_size_label), 200), '') AS pack_size_label,
        NULLIF(LEFT(REGEXP_REPLACE(TRIM(short_composition1), '\s+', ' ', 'g'), 300), '') AS salt1,
        NULLIF(LEFT(REGEXP_REPLACE(TRIM(short_composition2), '\s+', ' ', 'g'), 300), '') AS salt2,
        NULLIF(LEFT(REGEXP_REPLACE(TRIM(salt_composition), '\s+', ' ', 'g'), 1000), '') AS salt_composition,
        CASE
            WHEN raw_price ~ '^[0-9]+(\.[0-9]+)?$' THEN raw_price::NUMERIC(10,2)
            ELSE 0::NUMERIC(10,2)
        END AS mrp,
        CASE
            WHEN UPPER(COALESCE(is_discontinued, 'FALSE')) = 'TRUE' THEN FALSE
            ELSE TRUE
        END AS is_active
    FROM medicine_import_stage
    WHERE NULLIF(TRIM(name), '') IS NOT NULL
),
enriched AS (
    SELECT
        n.*,
        COALESCE(
            n.salt_composition,
            NULLIF(CONCAT_WS(' + ', n.salt1, n.salt2), '')
        ) AS composition_summary
    FROM normalized n
),
prepared AS (
    SELECT
        e.*,
        LEFT(
            TRIM(
                REGEXP_REPLACE(
                    COALESCE(e.salt1, SPLIT_PART(COALESCE(e.composition_summary, ''), '+', 1)),
                    '\s*\(.*$',
                    ''
                )
            ),
            300
        ) AS generic_name,
        NULLIF(SUBSTRING(COALESCE(e.salt1, e.composition_summary, '') FROM '\(([^)]+)\)'), '') AS strength,
        CASE
            WHEN COALESCE(e.pack_size_label, '') ~ '([0-9]+)' THEN (SUBSTRING(e.pack_size_label FROM '([0-9]+)'))::INT
            ELSE 10
        END AS pack_size,
        CASE
            WHEN UPPER(COALESCE(e.brand_name, '')) LIKE '%MORPHINE%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%CODEINE%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%FENTANYL%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%BUPRENORPHINE%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%OXYCODONE%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%PETHIDINE%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%MORPHINE%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%CODEINE%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%FENTANYL%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%BUPRENORPHINE%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%OXYCODONE%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%PETHIDINE%' THEN 'X'
            WHEN UPPER(COALESCE(e.brand_name, '')) LIKE '%ALPRAZOLAM%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%CLONAZEPAM%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%LORAZEPAM%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%DIAZEPAM%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%ZOLPIDEM%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%TRAMADOL%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%AZITHROMYCIN%'
              OR UPPER(COALESCE(e.brand_name, '')) LIKE '%CIPROFLOXACIN%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%ALPRAZOLAM%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%CLONAZEPAM%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%LORAZEPAM%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%DIAZEPAM%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%ZOLPIDEM%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%TRAMADOL%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%AZITHROMYCIN%'
              OR UPPER(COALESCE(e.composition_summary, '')) LIKE '%CIPROFLOXACIN%' THEN 'H1'
            WHEN e.medicine_type = 'allopathy' THEN 'H'
            ELSE 'NONE'
        END AS schedule_type,
        CASE
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%syrup%' OR LOWER(COALESCE(e.pack_size_label, '')) LIKE '%syrup%' THEN 'SYRUP'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%capsule%' THEN 'CAPSULE'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%injection%' THEN 'INJECTION'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%cream%' THEN 'CREAM'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%ointment%' THEN 'OINTMENT'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%drops%' THEN 'DROPS'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%suspension%' THEN 'SUSPENSION'
            WHEN LOWER(COALESCE(e.brand_name, '')) LIKE '%powder%' THEN 'POWDER'
            ELSE 'TABLET'
        END AS medicine_form
    FROM enriched e
)
INSERT INTO medicines (
    medicine_id,
    brand_name,
    generic_name,
    salt_id,
    manufacturer_id,
    medicine_form,
    strength,
    pack_size,
    barcode,
    hsn_code,
    gst_rate,
    mrp,
    ptr,
    pts,
    schedule_type,
    is_narcotic,
    is_psychotropic,
    requires_rx,
    reorder_level,
    pack_size_label,
    composition_summary,
    search_keywords,
    catalog_source,
    external_product_id,
    is_active
)
SELECT
    uuid_generate_v4(),
    p.brand_name,
    NULLIF(p.generic_name, ''),
    s.salt_id,
    m.manufacturer_id,
    p.medicine_form,
    p.strength,
    p.pack_size,
    NULL,
    NULL,
    12.00,
    p.mrp,
    ROUND(p.mrp * 0.80, 2),
    ROUND(p.mrp * 0.70, 2),
    p.schedule_type,
    CASE WHEN p.schedule_type = 'X' THEN TRUE ELSE FALSE END,
    CASE
        WHEN p.schedule_type = 'H1'
         AND (
            UPPER(COALESCE(p.brand_name, '')) LIKE '%ALPRAZOLAM%'
            OR UPPER(COALESCE(p.brand_name, '')) LIKE '%CLONAZEPAM%'
            OR UPPER(COALESCE(p.brand_name, '')) LIKE '%LORAZEPAM%'
            OR UPPER(COALESCE(p.brand_name, '')) LIKE '%DIAZEPAM%'
            OR UPPER(COALESCE(p.brand_name, '')) LIKE '%ZOLPIDEM%'
         )
        THEN TRUE
        ELSE FALSE
    END,
    CASE WHEN p.schedule_type IN ('H', 'H1', 'X') THEN TRUE ELSE FALSE END,
    10,
    p.pack_size_label,
    p.composition_summary,
    LEFT(
        CONCAT_WS(
            ' ',
            p.brand_name,
            p.generic_name,
            p.composition_summary,
            p.salt1,
            p.salt2,
            p.manufacturer_name,
            p.pack_size_label,
            p.medicine_type
        ),
        4000
    ),
    'JUNIORALIVE_GITHUB',
    p.source_id,
    p.is_active
FROM (
    SELECT
        prepared.*,
        ROW_NUMBER() OVER (
            PARTITION BY prepared.source_id
            ORDER BY prepared.brand_name, prepared.manufacturer_name NULLS LAST
        ) AS source_rank
    FROM prepared
) p
LEFT JOIN manufacturer_lookup m
    ON m.lookup_key = LOWER(TRIM(p.manufacturer_name))
LEFT JOIN salt_lookup s
    ON s.lookup_key = LOWER(TRIM(COALESCE(p.salt1, SPLIT_PART(COALESCE(p.composition_summary, ''), '+', 1))))
WHERE p.source_rank = 1;

CREATE INDEX IF NOT EXISTS idx_medicines_search_keywords_fts
    ON medicines
    USING GIN (to_tsvector('english', COALESCE(search_keywords, '')));

\echo 'Dataset import completed. Current catalogue counts:'
SELECT catalog_source, COUNT(*) AS medicine_count
FROM medicines
GROUP BY catalog_source
ORDER BY catalog_source;

SELECT COUNT(*) AS manufacturer_count FROM manufacturers;
SELECT COUNT(*) AS salt_count FROM salt_compositions;
