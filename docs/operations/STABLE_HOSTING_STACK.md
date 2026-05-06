# Stable Hosting Stack

This is the clean production-style hosting shape for the current PharmaFlow/LifePill app.

## Decision

Use this stack for a stable hosted demo or first customer pilot:

- Frontend: Netlify static site from `frontend/`
- Backend API: one always-on Docker web service from `backend/pos-system/`
- Database: one managed PostgreSQL database in the same region/provider as the backend
- Redis: disabled by default; the app has an in-memory fallback for the legacy cached PIN flow

Do not move the Spring Boot backend to Netlify Functions. Netlify is excellent for this React frontend, but this backend is a long-running Spring Boot service with Flyway, Hikari, JPA, and health checks.

## Recommended Path

### Fastest low-risk fix

Keep the current provider split, but stop using free sleeping infrastructure:

- `frontend/` on Netlify
- `backend/pos-system/` on Render `starter`
- Render Postgres `basic-256mb`
- Redis off: `PHARMAFLOW_REDIS_ENABLED=false`

This is the least risky path because it keeps the existing backend URL and database provider model, while removing the free-tier sleep/resource problems that caused the Hikari connection timeouts.

### Best clean migration path

If Render continues to be flaky after the paid upgrade:

- Keep `frontend/` on Netlify
- Move `backend/pos-system/` to Koyeb `eco-small` or larger
- Move Postgres to Koyeb `small` or another managed paid Postgres
- Keep Redis off unless the legacy PIN cache must survive restarts

Koyeb's free instance is useful only for preview. It scales to zero after idle time, so it is not the "perfect smooth" answer for a live pharmacy workflow.

## What We Host

Host only these:

- `frontend/`
- `backend/pos-system/`
- PostgreSQL

Do not host these for the current production path:

- `api-gateway/`
- `service-registry/`
- `backend/pharmaflow-api/`
- `dashboard/`
- `pharmaflow-web/`

Those are alternate or legacy tracks. Hosting them now adds failure modes without helping the current app.

## Required Production Checks

After every backend deploy:

```powershell
.\scripts\smoke_pharmaflow_host.ps1 -BackendBaseUrl "https://<backend-host>"
```

This checks:

- backend liveness/readiness
- SaaS admin login: `admin` / `Admin@123`
- PharmaFlow company admin login: `manager@pharmaflow.in` / `Company@123`
- PharmaFlow store operator login: `store@pharmaflow.in` / `Store@123`
- second tenant login: `manager@posible.in` / `Company@123`
- legacy owner login: `admin@lifepill.com` / `admin123`
- legacy cashier login: `cashier1@lifepill.com` / `password123`
- stores, suppliers, cached PIN login, and typo-tolerant medicine search

After frontend deploy:

```powershell
.\scripts\deploy_netlify_frontend.ps1 -BackendBaseUrl "https://<backend-host>" -DeploymentMode "Cloud demo on Netlify + stable backend"
```

## Why Not MongoDB Or Firebase Right Now

PostgreSQL is the right database for this codebase today. The app is built on Spring Data JPA entities, Flyway migrations, relational stock movement, invoices, GST reports, tenant scoping, and batch inventory. MongoDB or Firebase would be a rewrite, not a hosting fix.

The practical fix is: keep Postgres, make the DB/provider stable, reduce optional hosted services, add missing search indexes, and run smoke tests after deploy.

## Official References

- Render Blueprint service plans include `free`, `starter`, `standard`, and higher. Render uses `starter` for new services if no plan is specified.
- Render Blueprint database plans include current flexible Postgres plans such as `basic-256mb`; Render uses `basic-256mb` for new databases if no plan is specified.
- Koyeb free web instances scale down to zero after one hour of no traffic.
- Koyeb `eco-small` currently provides 1 GB RAM and is a better minimum for a Spring Boot web service than the free 512 MB preview instance.
- Netlify supports React static builds and SPA routing/proxy rules through `netlify.toml`.

References:

- [Render Blueprint YAML reference](https://render.com/docs/blueprint-spec)
- [Koyeb scale-to-zero](https://www.koyeb.com/docs/run-and-scale/scale-to-zero)
- [Koyeb instance reference](https://www.koyeb.com/docs/reference/instances)
- [Netlify React docs](https://docs.netlify.com/frameworks/react/)
- [Netlify routing docs](https://docs.netlify.com/manage/routing/overview/)
