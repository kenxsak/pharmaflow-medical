ALTER TABLE medicine_substitutes
    ALTER COLUMN id TYPE BIGINT;

ALTER SEQUENCE IF EXISTS medicine_substitutes_id_seq
    AS BIGINT;
