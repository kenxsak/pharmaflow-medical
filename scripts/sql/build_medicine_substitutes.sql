\set ON_ERROR_STOP on

\echo 'Building salt-based substitute mappings for imported medicines...'

CREATE UNIQUE INDEX IF NOT EXISTS uq_medicine_substitute_pair
    ON medicine_substitutes(medicine_id, substitute_id);

INSERT INTO medicine_substitutes (medicine_id, substitute_id, is_generic, price_diff_pct)
SELECT
    base.medicine_id,
    alt.substitute_id,
    alt.is_generic,
    alt.price_diff_pct
FROM medicines base
JOIN LATERAL (
    SELECT
        candidate.medicine_id AS substitute_id,
        CASE
            WHEN base.mrp IS NULL OR base.mrp = 0 OR candidate.mrp IS NULL THEN FALSE
            WHEN candidate.mrp <= base.mrp THEN TRUE
            ELSE FALSE
        END AS is_generic,
        CASE
            WHEN base.mrp IS NULL OR base.mrp = 0 OR candidate.mrp IS NULL THEN 0::NUMERIC(5,2)
            ELSE ROUND(((base.mrp - candidate.mrp) / base.mrp) * 100, 2)
        END AS price_diff_pct
    FROM medicines candidate
    WHERE candidate.salt_id = base.salt_id
      AND candidate.medicine_id <> base.medicine_id
      AND COALESCE(candidate.is_active, TRUE) = TRUE
    ORDER BY ABS(COALESCE(candidate.mrp, 0) - COALESCE(base.mrp, 0)), candidate.brand_name
    LIMIT 8
) alt ON TRUE
WHERE base.catalog_source = 'JUNIORALIVE_GITHUB'
  AND base.salt_id IS NOT NULL
  AND COALESCE(base.is_active, TRUE) = TRUE
ON CONFLICT (medicine_id, substitute_id) DO NOTHING;

\echo 'Substitute build completed.'
SELECT COUNT(*) AS substitute_count FROM medicine_substitutes;
