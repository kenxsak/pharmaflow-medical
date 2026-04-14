#!/bin/sh
set -e

# Render injects a standard Postgres URL like:
#   postgresql://user:password@host:5432/database?sslmode=require
# Spring expects a JDBC URL without embedded credentials, so normalize it here.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*)
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      ;;
    postgresql://*|postgres://*)
      normalized_url="${DATABASE_URL#postgresql://}"
      normalized_url="${normalized_url#postgres://}"

      host_and_db="${normalized_url#*@}"
      host_port="${host_and_db%%/*}"
      database_and_query="${host_and_db#*/}"
      database_name="${database_and_query%%\?*}"

      query_string=""
      if [ "$database_and_query" != "$database_name" ]; then
        query_string="?${database_and_query#*\?}"
      fi

      case "$host_port" in
        *:*)
          jdbc_host="$host_port"
          ;;
        *)
          jdbc_host="${host_port}:5432"
          ;;
      esac

      export SPRING_DATASOURCE_URL="jdbc:postgresql://${jdbc_host}/${database_name}${query_string}"
      ;;
  esac
fi

if [ -n "${DATABASE_USERNAME:-}" ] && [ -z "${SPRING_DATASOURCE_USERNAME:-}" ]; then
  export SPRING_DATASOURCE_USERNAME="$DATABASE_USERNAME"
fi

if [ -n "${DATABASE_PASSWORD:-}" ] && [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
  export SPRING_DATASOURCE_PASSWORD="$DATABASE_PASSWORD"
fi

java $JAVA_OPTS -jar app.jar &
app_pid=$!

if [ "${PHARMAFLOW_MEDICINE_AUTO_IMPORT:-false}" = "true" ]; then
  sh /app/run-medicine-import.sh &
fi

wait "$app_pid"
