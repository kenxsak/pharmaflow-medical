# PharmaFlow Demo Deployment

This repository contains the PharmaFlow/LifePill pharmacy SaaS demo stack:

- `frontend/` - React legacy-first UI
- `backend/pos-system/` - Spring Boot API
- `render.yaml` - free demo hosting blueprint for Render
- `docs/operations/` - first-customer operational runbooks

GitHub repo:

- `https://github.com/kenxsak/pharmaflow-medical`

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kenxsak/pharmaflow-medical)

## Free Demo Hosting

The fastest zero-cost demo deployment uses Render managed resources:

- `pharmaflow-frontend` - free static site
- `pharmaflow-backend` - free Docker web service
- `pharmaflow-db` - free Postgres
- `pharmaflow-cache` - free Render Key Value

### Deploy from GitHub

1. Push this repo to GitHub.
2. In Render, click `New` -> `Blueprint`.
3. Connect the GitHub repo.
4. Select the default branch and confirm `render.yaml`.
5. Deploy the Blueprint.

Render will provision the frontend, backend, Postgres, and Redis-compatible cache from the single blueprint.

If the repo stays private, Render needs access to it through the Render GitHub App during setup.

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

- The free demo stack is suitable for sales demos and internal testing, not production.
- Free Render services can sleep after inactivity.
- For a paid customer, configure object storage and keep `HIBERNATE_DDL_AUTO=validate`.

## First Paid Customer

- Phase 1 deployment checklist: `docs/operations/FIRST_CUSTOMER_PHASE1.md`
- Backup and restore runbook: `docs/operations/BACKUP_RESTORE.md`

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
