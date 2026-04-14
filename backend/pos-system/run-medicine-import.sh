#!/bin/sh
set -eu

log() {
  printf '%s\n' "[medicine-import] $*"
}

AUTO_IMPORT="${PHARMAFLOW_MEDICINE_AUTO_IMPORT:-false}"
if [ "$AUTO_IMPORT" != "true" ]; then
  log "Auto import disabled."
  exit 0
fi

DATASET_PATH="${PHARMAFLOW_MEDICINE_DATASET_PATH:-/app/import-data/updated_indian_medicine_data.csv}"
IMPORT_SQL_PATH="${PHARMAFLOW_MEDICINE_IMPORT_SQL_PATH:-/app/import-sql/import_indian_medicine_dataset.sql}"
SUBSTITUTE_SQL_PATH="${PHARMAFLOW_MEDICINE_SUBSTITUTE_SQL_PATH:-/app/import-sql/build_medicine_substitutes.sql}"
CATALOG_SOURCE="${PHARMAFLOW_MEDICINE_CATALOG_SOURCE:-JUNIORALIVE_GITHUB}"
MAX_WAIT_SECONDS="${PHARMAFLOW_MEDICINE_IMPORT_MAX_WAIT_SECONDS:-900}"
SLEEP_SECONDS=5

if [ ! -f "$DATASET_PATH" ]; then
  log "Dataset file not found at $DATASET_PATH. Skipping import."
  exit 0
fi

if [ ! -f "$IMPORT_SQL_PATH" ] || [ ! -f "$SUBSTITUTE_SQL_PATH" ]; then
  log "Import SQL assets are missing. Skipping import."
  exit 0
fi

JDBC_URL="${SPRING_DATASOURCE_URL:-${DATABASE_URL:-}}"
DB_USERNAME="${SPRING_DATASOURCE_USERNAME:-${DATABASE_USERNAME:-}}"
DB_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-${DATABASE_PASSWORD:-}}"

if [ -z "${JDBC_URL:-}" ]; then
  log "No datasource URL found. Skipping import."
  exit 0
fi

parse_sslmode() {
  case "$1" in
    *\?*)
      printf '%s' "$1" | sed -n 's/.*[?&]sslmode=\([^&]*\).*/\1/p'
      ;;
    *)
      printf ''
      ;;
  esac
}

case "$JDBC_URL" in
  postgresql://*|postgres://*)
    connection_body="${JDBC_URL#postgresql://}"
    connection_body="${connection_body#postgres://}"
    auth_part="${connection_body%@*}"
    host_and_db="${connection_body#*@}"

    if [ "$auth_part" != "$connection_body" ]; then
      DB_USERNAME="${auth_part%%:*}"
      DB_PASSWORD="${auth_part#*:}"
    fi
    ;;
  jdbc:postgresql://*)
    host_and_db="${JDBC_URL#jdbc:postgresql://}"
    ;;
  *)
    log "Unsupported datasource format: $JDBC_URL"
    exit 0
    ;;
esac

host_port="${host_and_db%%/*}"
database_and_query="${host_and_db#*/}"
DB_NAME="${database_and_query%%\?*}"
DB_HOST="${host_port%%:*}"
DB_PORT="${host_port#*:}"

if [ "$DB_PORT" = "$host_port" ]; then
  DB_PORT="5432"
fi

DB_SSLMODE="$(parse_sslmode "$database_and_query")"

export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGDATABASE="$DB_NAME"
export PGUSER="${DB_USERNAME:-}"
export PGPASSWORD="${DB_PASSWORD:-}"

if [ -n "$DB_SSLMODE" ]; then
  export PGSSLMODE="$DB_SSLMODE"
fi

psql_cmd() {
  psql -v ON_ERROR_STOP=1 "$@"
}

log "Waiting for PostgreSQL at ${PGHOST}:${PGPORT}/${PGDATABASE}..."
elapsed=0
until pg_isready >/dev/null 2>&1; do
  sleep "$SLEEP_SECONDS"
  elapsed=$((elapsed + SLEEP_SECONDS))
  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    log "Database did not become ready in time."
    exit 1
  fi
done

log "Waiting for application-managed tables..."
elapsed=0
until [ "$(psql -tAc "SELECT CASE WHEN to_regclass('public.medicines') IS NOT NULL AND to_regclass('public.manufacturers') IS NOT NULL AND to_regclass('public.salt_compositions') IS NOT NULL AND to_regclass('public.medicine_substitutes') IS NOT NULL THEN 1 ELSE 0 END;" | tr -d '[:space:]')" = "1" ]; do
  sleep "$SLEEP_SECONDS"
  elapsed=$((elapsed + SLEEP_SECONDS))
  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    log "Timed out waiting for required tables."
    exit 1
  fi
done

catalog_medicine_count="$(psql -tAc "SELECT COUNT(*) FROM medicines WHERE catalog_source='${CATALOG_SOURCE}';" | tr -d '[:space:]')"
catalog_substitute_count="$(psql -tAc "SELECT COUNT(*) FROM medicine_substitutes ms JOIN medicines m ON m.medicine_id = ms.medicine_id WHERE m.catalog_source='${CATALOG_SOURCE}';" | tr -d '[:space:]')"

log "Current catalog counts: medicines=${catalog_medicine_count:-0}, substitutes=${catalog_substitute_count:-0}"

if [ "${catalog_medicine_count:-0}" = "0" ]; then
  log "Running full medicine catalog import from tracked CSV."
  psql_cmd -f "$IMPORT_SQL_PATH"
  psql_cmd -f "$SUBSTITUTE_SQL_PATH"
elif [ "${catalog_substitute_count:-0}" = "0" ]; then
  log "Medicines already exist. Building missing substitute mappings."
  psql_cmd -f "$SUBSTITUTE_SQL_PATH"
else
  log "Catalog already loaded. Skipping import."
  exit 0
fi

final_counts="$(psql -tAc "SELECT CONCAT((SELECT COUNT(*) FROM medicines WHERE catalog_source='${CATALOG_SOURCE}'), '|', (SELECT COUNT(*) FROM medicine_substitutes ms JOIN medicines m ON m.medicine_id = ms.medicine_id WHERE m.catalog_source='${CATALOG_SOURCE}'));" | tr -d '[:space:]')"
log "Completed catalog load: ${final_counts}"
