# Render PharmaFlow Removal Record

Date: 2026-05-07
Workspace: ken's workspace

This file records the PharmaFlow resources removed from the current Render
account so the workspace can be reused safely without touching unrelated apps.

## Remove From This Render Account

| Resource | Render type | ID | Region | URL / dashboard |
| --- | --- | --- | --- | --- |
| pharmaflow-backend | Web service, Docker | srv-d7eub9v7f7vs73ddrihg | Singapore | https://pharmaflow-backend-vr51.onrender.com |
| pharmaflow-frontend | Static site | srv-d7euo7osfn5c738j898g | Global | https://pharmaflow-frontend.onrender.com |
| pharmaflow-db | Postgres 18 | dpg-d7euakn7f7vs73ddr580-a | Singapore | database: pharmaflow_mrh8 |
| pharmaflow-cache | Key Value / Valkey 8 | red-d7euakf7f7vs73ddr52g | Singapore | dashboard: /r/red-d7euakf7f7vs73ddr52g |

## Blueprint Cleanup

The old Render Blueprint was also disconnected so this account does not
auto-recreate PharmaFlow resources on future pushes.

| Blueprint | ID | Repo | Action |
| --- | --- | --- | --- |
| farma | exs-d7eu9jvlk1mc73c1u1kg | https://github.com/kenxsak/pharmaflow-medical | Disconnected |

During the final Blueprint sync, Render briefly recreated these resources. They
were deleted after disconnecting the Blueprint:

| Resource | Render type | ID |
| --- | --- | --- |
| pharmaflow-backend | Web service, Docker | srv-d7u5ip0sfn5c73cn4kfg |
| pharmaflow-db | Postgres 18 | dpg-d7u5iegsfn5c73cn49k0-a |

## Do Not Touch

| Resource | Render type | ID | URL |
| --- | --- | --- | --- |
| securefakemail | Static site | srv-cv9cr10gph6c73aktqrg | https://securefakemail-frontend.onrender.com |
| securefakemail-backend | Web service, Node | srv-cv9bbepu0jms73ehs1h0 | https://securefakemail-backend.onrender.com |

## Redeploy Notes

- Keep the frontend on Netlify; Render does not need to host `pharmaflow-frontend`.
- Recreate only the backend and database on the alternate Render account unless Redis/Valkey is explicitly re-enabled.
- Use `render.yaml` from this repo for backend/database infrastructure.
- Set the Netlify frontend backend URL to the new backend service URL after redeploy.
