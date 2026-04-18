# Free Hosting Stack

This is the recommended free-ish hosted setup for PharmaFlow:

- frontend: Netlify
- backend: Koyeb
- database: Neon Postgres
- Redis: optional, disabled by default with in-memory fallback

The current repo also contains a temporary Netlify proxy bridge to the existing hosted backend so the Netlify frontend can work before the Koyeb backend cutover is complete. Replace those proxy targets when the Koyeb backend is live.

## Why this stack

- Netlify is the right fit for the React frontend and Git-based static deploys.
- Koyeb supports Spring Boot as a real web service and keeps the backend on an app host instead of forcing it into a serverless frontend platform.
- Neon gives a cleaner free Postgres experience and supports pooled connection strings for small hosted apps.

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
- `DATABASE_URL=jdbc:postgresql://<neon-pooled-host>/<db>?sslmode=require&channel_binding=require`
- `DATABASE_USERNAME=<neon-user>`
- `DATABASE_PASSWORD=<neon-password>`
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
- [Expose a Koyeb web service](https://www.koyeb.com/docs/build-and-deploy/exposing-your-service)
- [Koyeb environment variables](https://www.koyeb.com/docs/build-and-deploy/environment-variables)
- [Koyeb scale-to-zero](https://www.koyeb.com/docs/run-and-scale/scale-to-zero)

## Database on Neon

Use Neon’s pooled connection string for the hosted app. Neon’s pooler endpoint includes `-pooler` in the hostname.

Important notes:

- use the pooled connection string for normal app traffic
- keep migrations and heavy admin operations on a direct connection if needed
- keep the backend pool small on free hosting

Official references:

- [Neon pooled connections](https://neon.com/docs/connect/connection-pooling)
- [Connect Neon to your stack](https://neon.com/docs/get-started-with-neon/connect-neon)

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

1. Create Neon and copy the pooled Postgres credentials.
2. Deploy the backend to Koyeb with the env values above.
3. Wait for `https://<backend>.koyeb.app/actuator/health/liveness` to return `200`.
4. Deploy the frontend to Netlify using the repo and `netlify.toml`.
5. Set the Netlify API env vars to the Koyeb backend URL.
6. Update backend `CORS_ALLOWED_ORIGIN_PATTERNS` to include the final Netlify domain.
