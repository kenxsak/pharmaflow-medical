# PharmaFlow Demo Deployment

This repository contains the PharmaFlow/LifePill pharmacy SaaS demo stack:

- `frontend/` - React legacy-first UI
- `backend/pos-system/` - Spring Boot API
- `render.yaml` - free demo hosting blueprint for Render

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

## Notes

- The free demo stack is suitable for sales demos and internal testing, not production.
- Free Render services can sleep after inactivity.
- Uploaded files on the free backend are ephemeral until production storage is added.
