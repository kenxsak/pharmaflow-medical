# PharmaFlow Demo Deployment

This repository contains the PharmaFlow/LifePill pharmacy SaaS demo stack:

- `frontend/` - React legacy-first UI
- `backend/pos-system/` - Spring Boot API
- `netlify.toml` - free frontend hosting config for Netlify
- `render.yaml` - legacy Render blueprint kept as fallback
- `docs/operations/` - first-customer operational runbooks

GitHub repo:

- `https://github.com/kenxsak/pharmaflow-medical`

## Actual Hosted Stack

The current product that should be hosted is:

- `frontend/` - the main React frontend
- `backend/pos-system/` - the Spring Boot API the main frontend actually talks to
- PostgreSQL - the system of record for billing, inventory, compliance, and reporting
- Redis - optional on the free stack and disabled by default

These folders are not part of the main hosted demo flow right now:

- `api-gateway/`
- `service-registry/`
- `backend/pharmaflow-api/`
- `dashboard/`
- `pharmaflow-web/`

They are legacy, alternate, or local-only pieces and should not be blindly deployed as if they are part of the live customer path.

## Free Demo Hosting

The recommended low-cost hosted stack is:

- `Netlify` - frontend
- `Koyeb` - Spring Boot backend
- `Koyeb Postgres` - simplest one-provider free database path
- `Redis` - optional, now disabled by default on the free stack

Why this split:

- Netlify is a strong fit for the React frontend.
- Koyeb can run Spring Boot as a real web service.
- Neon provides a better small Postgres experience for free hosting than trying to squeeze app and database concerns into one platform.

Deployment guide:

- `docs/operations/FREE_HOSTING_STACK.md`

Legacy Render blueprint:

- `render.yaml`

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kenxsak/pharmaflow-medical)

### Netlify + Koyeb

1. Create a free Koyeb Postgres database.
2. Deploy the backend on Koyeb from this repo using the existing backend Dockerfile.
3. Confirm backend liveness at `/actuator/health/liveness`.
4. Deploy the frontend on Netlify from this repo using `netlify.toml`.
5. Point Netlify env vars at the Koyeb backend URL.

CLI helpers now live in `scripts/`:

- `scripts/install_koyeb_cli.ps1`
- `scripts/deploy_koyeb_database.ps1`
- `scripts/deploy_koyeb_backend.ps1`
- `scripts/deploy_netlify_frontend.ps1`

The app can now run without hosted Redis by setting `PHARMAFLOW_REDIS_ENABLED=false`, which removes one hosted dependency from the free stack.

Right now, the checked-in Netlify config also includes a temporary proxy bridge to the current hosted backend so the new Netlify URL can work immediately during the migration.

### Legacy Render fallback

If you need one-click provisioning instead of the split free stack above, the Render blueprint is still available through `render.yaml`.

## Local Development

Use Docker Compose from the repo root:

```bash
docker compose up --build
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## Phase 1 Hardening

The backend now includes:

- Flyway migration support with baseline-on-migrate
- Hibernate schema validation by default
- prescription/document upload with local fallback and S3-ready storage
- root CI workflow in `.github/workflows/ci.yml`
- PostgreSQL backup and restore scripts in `scripts/`

## Notes

- The free stack is suitable for demos and internal testing, not production.
- Netlify handles the frontend only. Do not move the Spring Boot backend to Netlify.
- Free hosts can still sleep after inactivity, but the new default free stack removes Redis as a required dependency.
- For a paid customer, configure object storage and keep `HIBERNATE_DDL_AUTO=validate`.

## First Paid Customer

- Phase 1 deployment checklist: `docs/operations/FIRST_CUSTOMER_PHASE1.md`
- Backup and restore runbook: `docs/operations/BACKUP_RESTORE.md`
- Free hosting guide: `docs/operations/FREE_HOSTING_STACK.md`

## Medicine Catalogue

- The tracked junioralive dataset CSV lives in `backend/pos-system/import-data/updated_indian_medicine_data.csv`.
- The backend image includes the CSV plus the import SQL in `backend/pos-system/import-sql/`.
- Local Docker keeps `PHARMAFLOW_MEDICINE_AUTO_IMPORT=true` for easy bootstrap.
- Render keeps `PHARMAFLOW_MEDICINE_AUTO_IMPORT=false` for runtime stability after the catalog is loaded.
- Render and container health checks should target `/actuator/health/liveness`.
- Use `/actuator/health/readiness` when you want a DB-aware backend readiness check.
- Keep public actuator exposure narrow by default: `health` and `info` on hosted stacks, `prometheus` only where local monitoring needs it.
- Root `/actuator/health` should not be the public hosting probe path.
- Every backend response now returns an `X-Request-ID` header, and slow or failing requests are logged with that same ID.
- The backend now identifies itself to Postgres with an explicit application name and Hikari pool name for faster incident triage.
- Super-admins can now query `/api/v1/platform/runtime/database` for a live pool-pressure snapshot without exposing broader actuator data.
- On first boot, the backend checks whether `JUNIORALIVE_GITHUB` medicines already exist:
  - if not, it imports the medicine catalogue and builds salt-based substitutes automatically
  - if medicines exist but substitutes do not, it builds only the substitutes
  - if both exist, it skips the import cleanly

For manual local reloads, run:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\import_indian_medicine_dataset.ps1
```

Runtime incident steps:

- see `docs/operations/RENDER_RUNTIME_INCIDENT.md`
