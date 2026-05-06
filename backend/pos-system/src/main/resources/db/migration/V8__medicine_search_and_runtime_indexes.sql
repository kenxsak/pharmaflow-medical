CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keep this Flyway migration intentionally lightweight. The hosted Render deploy
-- can time out while building large GIN indexes during Spring Boot startup.
-- Run docs/operations/sql/create_medicine_search_indexes_concurrently.sql after
-- the app is live to add the heavier search indexes without blocking startup.
