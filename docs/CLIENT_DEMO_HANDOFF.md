# MedInOne Client Demo Handoff

Use this as the clean checklist before sharing the MedInOne demo with a client.

## Live URLs

- Client frontend: `https://pharmaflow-medical.netlify.app`
- Backend API: `https://pharmaflow-backend-fou9.onrender.com`
- Backend liveness check: `https://pharmaflow-backend-fou9.onrender.com/actuator/health/liveness`

## Keepalive

The current no-cost demo setup uses the Netlify Scheduled Function at:

```text
frontend/netlify/functions/keep-demo-backend-warm.mjs
```

It pings the backend every 10 minutes. If you also set up cron-job.org or UptimeRobot, use:

- Method: `GET`
- URL: `https://pharmaflow-backend-fou9.onrender.com/actuator/health/liveness`
- Interval: `10 minutes`
- Expected status: `200`
- Timeout: `30 to 45 seconds`

## Client UI Logins

Open `https://pharmaflow-medical.netlify.app/#/legacy-login`.

| Persona | Username | Password | Expected Start Page |
| --- | --- | --- | --- |
| SaaS/platform admin | `admin` | `Admin@123` | Manager dashboard |
| MedInOne company admin | `manager@medinone.in` | `Company@123` | Manager dashboard |
| Anna Nagar store operator | `store@medinone.in` | `Store@123` | Cashier dashboard |
| Delivery rider | `driver@medinone.in` | `Driver@123` | Online & Delivery |
| Posible Rx company admin | `manager@posible.in` | `Company@123` | Manager dashboard |

Legacy backend compatibility logins still exist for smoke tests:

| Persona | Username | Password |
| --- | --- | --- |
| Legacy owner | `owner@medinone.in` | `admin123` |
| Legacy cashier | `cashier@medinone.in` | `password123` |

## Feature Walkthrough

- Start with **Counter** for medicine search, barcode lookup, substitutes, GST billing, and customer lookup.
- Open **Stock** for batch quantity, expiry, loose units, and movement ledger.
- Use **Purchases** for suppliers, purchase orders, receipts, and credit notes.
- Use **Compliance** for controlled-drug registers and prescription archive.
- Use **Reports** for GST, profit, shortage, expiry, and stock loss views.
- Use **Online & Delivery** for delivery queue, rider assignment, status updates, GPS point capture, and map links.
- Use **Users & Access** from an admin login to review company admins, store operators, and delivery rider access.

## Pre-Demo Smoke Test

Run this before giving the link to a client:

```powershell
.\scripts\smoke_pharmaflow_host.ps1 -BackendBaseUrl "https://pharmaflow-backend-fou9.onrender.com"
```

This checks health, all main logins, stores, suppliers, medicine search, delivery rider access, and legacy compatibility.

## Honest Free-Tier Limits

This is the best no-cost demo setup we can run without rewriting the backend or paying for always-on hosting. Netlify keeps the frontend always available, and the scheduled function keeps pinging the backend. Render Free can still restart during deploys, maintenance, or provider-side limits, so a paid always-on backend is the right move before real pharmacy production use.
