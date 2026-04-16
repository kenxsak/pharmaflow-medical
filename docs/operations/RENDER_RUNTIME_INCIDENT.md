# Render Runtime Incident Guide

Use this when the backend is up but Render reports instability, slow health checks, or intermittent database failures.

## What good looks like

- `GET /actuator/health/liveness` returns `200`
- `GET /actuator/health/readiness` returns `200`
- anonymous `GET /actuator/health` returns `403`
- backend logs stay at `INFO` by default, without Spring Security debug spam
- responses include `X-Request-ID`

## Fast triage order

1. Check liveness first.
2. Check readiness second.
3. Check recent backend logs for:
   - `HikariPool-1 - Connection is not available`
   - `request_diagnostics`
   - repeated Flyway restarts or container restarts
4. Confirm Render env values are still set for:
   - `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=4`
   - `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=0`
   - `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=10000`
   - `SPRING_DATASOURCE_CONNECT_TIMEOUT=10`
   - `SPRING_DATASOURCE_SOCKET_TIMEOUT=30`
   - `PHARMAFLOW_MEDICINE_AUTO_IMPORT=false`

## Curl checks

```bash
curl -i https://<backend-host>/actuator/health/liveness
curl -i https://<backend-host>/actuator/health/readiness
curl -i https://<backend-host>/actuator/health
```

Expected:

- `liveness` = `200`
- `readiness` = `200`
- root `health` = `403`

## Reading request diagnostics

Slow or failing requests now log in this shape:

```text
request_diagnostics requestId=<id> method=<verb> path=<path> status=<code> durationMs=<ms> storeId=<id> tenantId=<id> tenantSlug=<slug>
```

Use the `requestId` from:

- browser devtools response headers
- API client response headers
- reverse proxy logs

This is the fastest way to match a bad user action to backend logs.

## Local deep dive

The local backend stack exposes Prometheus at `/actuator/prometheus`.

Useful local checks:

- `http_server_requests_seconds`
- `hikaricp_connections_active`
- `hikaricp_connections_idle`
- `hikaricp_connections_pending`
- `hikaricp_connections_acquire_seconds`
- `hikaricp_connections_usage_seconds`

If `pending` rises while `active` stays pinned, the database pool is saturated.

## When readiness fails but liveness passes

This usually means:

- Postgres is slow or unavailable
- too many concurrent requests are waiting on the pool
- long-running requests are holding connections too long

Check:

- whether the DB provider is degraded
- whether recent logs show the same path repeatedly in `request_diagnostics`
- whether a deploy or restart re-enabled heavy startup work

## Safe response actions

- leave Render health checks pointed at `/actuator/health/liveness`
- do not move the Spring Boot backend to Netlify
- keep `PHARMAFLOW_MEDICINE_AUTO_IMPORT=false` on hosted environments after the catalog is loaded
- if the DB is clearly saturated, scale traffic down or restart once after confirming no migration/import work is running
