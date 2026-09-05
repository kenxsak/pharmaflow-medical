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

      raw_host="${host_port%%:*}"
      port_suffix=""
      if [ "$raw_host" != "$host_port" ]; then
        port_suffix=":${host_port#*:}"
      else
        port_suffix=":5432"
      fi

      case "$raw_host" in
        dpg-*)
          if ! echo "$raw_host" | grep -q '\.'; then
            if ! getent hosts "$raw_host" >/dev/null 2>&1; then
              for r in "${RENDER_REGION:-singapore}" oregon frankfurt ohio virginia; do
                candidate="${raw_host}.${r}-postgres.render.com"
                if getent hosts "$candidate" >/dev/null 2>&1; then
                  echo "Entrypoint: Resolved internal host ${raw_host} -> ${candidate}"
                  raw_host="$candidate"
                  break
                fi
              done
            fi
          fi
          ;;
      esac

      jdbc_host="${raw_host}${port_suffix}"

      case "$jdbc_host" in
        *.render.com*|*amazonaws.com*|*neon.tech*|*supabase.co*)
          if [ -z "$query_string" ]; then
            query_string="?sslmode=require"
          elif ! echo "$query_string" | grep -q "sslmode"; then
            query_string="${query_string}&sslmode=require"
          fi
          ;;
        *)
          # Internal Render network (dpg-*), localhost, and private hosts do not use SSL
          ;;
      esac

      export SPRING_DATASOURCE_URL="jdbc:postgresql://${jdbc_host}/${database_name}${query_string}"
      export DATABASE_URL="$SPRING_DATASOURCE_URL"

      if [ -z "${DATABASE_USERNAME:-}" ] && [ -z "${SPRING_DATASOURCE_USERNAME:-}" ]; then
        user_pass="${normalized_url%@*}"
        if [ "$user_pass" != "$normalized_url" ]; then
          db_user="${user_pass%%:*}"
          db_pass="${user_pass#*:}"
          if [ -n "$db_user" ]; then
            export DATABASE_USERNAME="$db_user"
            export SPRING_DATASOURCE_USERNAME="$db_user"
          fi
          if [ -n "$db_pass" ] && [ "$db_pass" != "$user_pass" ]; then
            export DATABASE_PASSWORD="$db_pass"
            export SPRING_DATASOURCE_PASSWORD="$db_pass"
          fi
        fi
      fi
      ;;
  esac
fi

if [ -n "${DATABASE_USERNAME:-}" ] && [ -z "${SPRING_DATASOURCE_USERNAME:-}" ]; then
  export SPRING_DATASOURCE_USERNAME="$DATABASE_USERNAME"
fi

if [ -n "${DATABASE_PASSWORD:-}" ] && [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
  export SPRING_DATASOURCE_PASSWORD="$DATABASE_PASSWORD"
fi

if [ -z "${SPRING_PROFILES_ACTIVE:-}" ]; then
  export SPRING_PROFILES_ACTIVE=render
fi

default_java_opts="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"
JAVA_OPTS="${JAVA_OPTS:-$default_java_opts}"

echo "Starting PharmaFlow backend with profile(s): ${SPRING_PROFILES_ACTIVE}"
echo "Configured Datasource URL: $(echo "${SPRING_DATASOURCE_URL:-$DATABASE_URL}" | sed -E 's/:[^@\/]+@/:****@/g')"
echo "Configured Datasource Username: ${SPRING_DATASOURCE_USERNAME:-$DATABASE_USERNAME}"

if [ "${PHARMAFLOW_MEDICINE_AUTO_IMPORT:-false}" = "true" ]; then
  java $JAVA_OPTS -jar app.jar &
  app_pid=$!
  sh /app/run-medicine-import.sh &
  wait "$app_pid"
else
  exec java $JAVA_OPTS -jar app.jar
fi
