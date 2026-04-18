# Free Hosting Stack

This is the recommended free-ish hosted setup for PharmaFlow:

- frontend: Netlify
- backend: Koyeb web service
- database: Koyeb Postgres database service
- Redis: optional, disabled by default with in-memory fallback

The current repo also contains a temporary Netlify proxy bridge to the existing hosted backend so the Netlify frontend can work before the Koyeb backend cutover is complete. Replace those proxy targets when the Koyeb backend is live.

## What actually needs hosting

Host these pieces for the current live product:

- `frontend/`
- `backend/pos-system/`
- one PostgreSQL database

Do not treat these as required hosted services for the current demo:

- `api-gateway/`
- `service-registry/`
- `backend/pharmaflow-api/`
- `dashboard/`
- `pharmaflow-web/`

They are alternate or legacy tracks and will only add confusion, extra spend, and broken integrations if we deploy them by default.

## Why this stack

- Netlify is the right fit for the React frontend and Git-based static deploys.
- Koyeb supports Spring Boot as a real web service and keeps the backend on an app host instead of forcing it into a serverless frontend platform.
- Koyeb Postgres keeps the demo backend and demo database on one provider, which reduces setup friction and credential mistakes.
- Redis is already optional, so the smallest hosted stack is now frontend + backend + Postgres.

## Frontend on Netlify

The repo now includes `netlify.toml`, so Netlify can build directly from Git:

- base directory: `frontend`
- build command: `npm ci --legacy-peer-deps && npm run build`
- publish directory: `build`

Set these Netlify environment variables:

- `REACT_APP_BACKEND_URL=https://<your-backend>.koyeb.app`
- `REACT_APP_API_URL=https://<your-backend>.koyeb.app/api/v1`
- `REACT_APP_LEGACY_API_URL=https://<your-backend>.koyeb.app/lifepill/v1`
- `REACT_APP_WS_URL=https://<your-backend>.koyeb.app/ws`
- `REACT_APP_BRAND_DEPLOYMENT_MODE=Cloud demo on Netlify + Koyeb`

Official references:

- [Netlify build configuration](https://docs.netlify.com/build/configure-builds/overview/)
- [Netlify CLI getting started](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/)
- [Netlify rewrites for SPAs](https://docs.netlify.com/routing/redirects/rewrites-proxies/)

## Backend on Koyeb

Use the existing backend Dockerfile at `backend/pos-system/Dockerfile`. Koyeb supports Spring Boot from Git or Dockerfile.

Recommended Koyeb environment variables:

- `SERVER_PORT=8080`
- `DATABASE_URL=jdbc:postgresql://<koyeb-host>:5432/<db>?sslmode=require`
- `DATABASE_USERNAME=<koyeb-user>`
- `DATABASE_PASSWORD=<koyeb-password>`
- `SPRING_DATASOURCE_HIKARI_POOL_NAME=pharmaflow-koyeb`
- `SPRING_DATASOURCE_APPLICATION_NAME=pharmaflow-koyeb`
- `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=3`
- `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=0`
- `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=10000`
- `SPRING_DATASOURCE_CONNECT_TIMEOUT=10`
- `SPRING_DATASOURCE_SOCKET_TIMEOUT=30`
- `PHARMAFLOW_REDIS_ENABLED=false`
- `REDIS_HEALTH=false`
- `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info`
- `MANAGEMENT_HEALTH_READINESS_INCLUDE=readinessState,db`
- `SECURITY_LOG_LEVEL=INFO`
- `PHARMAFLOW_MEDICINE_AUTO_IMPORT=false`
- `CORS_ALLOWED_ORIGIN_PATTERNS=https://*.netlify.app,https://<your-netlify-domain>`
- `JWT_SECRET=<long-random-secret>`

Health check paths:

- public hosting probe: `/actuator/health/liveness`
- operator check: `/actuator/health/readiness`

Official references:

- [Deploy a Spring Boot app on Koyeb](https://www.koyeb.com/docs/deploy/spring-boot)
- [Deploy a project directory with Koyeb CLI](https://www.koyeb.com/docs/build-and-deploy/deploy-project-directory)
- [Expose a Koyeb web service](https://www.koyeb.com/docs/build-and-deploy/exposing-your-service)
- [Koyeb environment variables](https://www.koyeb.com/docs/build-and-deploy/environment-variables)
- [Koyeb health checks](https://www.koyeb.com/docs/run-and-scale/health-checks)
- [Koyeb scale-to-zero](https://www.koyeb.com/docs/run-and-scale/scale-to-zero)

## Database on Koyeb

Use a Koyeb Postgres database service for the easiest all-CLI free path.

Recommended defaults:

- database service name: `pharmaflow-db`
- database name: `pharmaflow`
- database owner: `pharmaflow_user`
- region: `fra`
- instance type: `free`

Important notes:

- free Koyeb web instances are limited to one free web service per organization and cannot run worker services
- free web instances are currently limited to Frankfurt or Washington, D.C.
- Koyeb Postgres sleeps after inactivity and wakes on the next query, so the first request after idle can be slower
- keep the backend pool small on free hosting

Official references:

- [Koyeb databases](https://www.koyeb.com/docs/databases)
- [Koyeb CLI reference](https://www.koyeb.com/docs/build-and-deploy/cli/reference)

If you want a separate database provider later, Neon is still a good option, but it is no longer the simplest default path.

## Redis fallback

PharmaFlow now supports running without hosted Redis. When `PHARMAFLOW_REDIS_ENABLED=false`, the app falls back to an in-memory cache for the employer-details flow used by the legacy PIN path.

Tradeoff:

- simpler free deployment
- legacy cached PIN data is not durable across restarts or sleep cycles

If you later want stronger durability for the legacy PIN flow, add a small hosted Redis and set:

- `PHARMAFLOW_REDIS_ENABLED=true`
- `REDIS_URL=<your-redis-url>`
- `REDIS_HEALTH=true`
- `MANAGEMENT_HEALTH_READINESS_INCLUDE=readinessState,db,redis`

## Deployment order

1. Create the Koyeb Postgres database and copy the connection details.
2. Deploy the backend to Koyeb with the env values above.
3. Wait for `https://<backend>.koyeb.app/actuator/health/liveness` to return `200`.
4. Deploy the frontend to Netlify using the repo and `netlify.toml`.
5. Set the Netlify API env vars to the Koyeb backend URL.
6. Update backend `CORS_ALLOWED_ORIGIN_PATTERNS` to include the final Netlify domain.

CLI helpers checked into this repo:

- `scripts/install_koyeb_cli.ps1`
- `scripts/deploy_koyeb_database.ps1`
- `scripts/deploy_koyeb_backend.ps1`
- `scripts/deploy_netlify_frontend.ps1`
