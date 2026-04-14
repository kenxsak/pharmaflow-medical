#!/bin/sh
set -e

# Render injects a standard Postgres URL like postgresql://... while Spring expects
# a JDBC URL. Normalize it automatically so the same image works in both places.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${SPRING_DATASOURCE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:postgresql://*)
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      ;;
    postgresql://*)
      export SPRING_DATASOURCE_URL="jdbc:$DATABASE_URL"
      ;;
    postgres://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
      ;;
  esac
fi

if [ -n "${DATABASE_USERNAME:-}" ] && [ -z "${SPRING_DATASOURCE_USERNAME:-}" ]; then
  export SPRING_DATASOURCE_USERNAME="$DATABASE_USERNAME"
fi

if [ -n "${DATABASE_PASSWORD:-}" ] && [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
  export SPRING_DATASOURCE_PASSWORD="$DATABASE_PASSWORD"
fi

exec java $JAVA_OPTS -jar app.jar
