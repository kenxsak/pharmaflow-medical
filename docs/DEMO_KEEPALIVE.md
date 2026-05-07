# Demo Keepalive Setup

Render Free web services spin down after 15 minutes without inbound traffic. For a no-cost client demo, keep one lightweight health request running on a schedule so the backend is already warm when the client opens the app.

## Current Deployed Setup

The frontend is deployed on Netlify, and this repo includes a Netlify Scheduled Function:

```text
frontend/netlify/functions/keep-demo-backend-warm.mjs
```

It pings the backend liveness endpoint every 10 minutes:

```text
https://pharmaflow-backend-fou9.onrender.com/actuator/health/liveness
```

Check it in Netlify under **Logs -> Functions** for the `keep-demo-backend-warm` function.

## Optional External Backup Cron

If you want a second free backup monitor, use one of these:

- UptimeRobot free monitor, every 5 minutes
- cron-job.org free cron job, every 10 minutes

Ping this URL:

```text
https://pharmaflow-backend-fou9.onrender.com/actuator/health/liveness
```

Recommended settings:

- Method: `GET`
- Interval: `5 minutes` if using UptimeRobot, or `10 minutes` if using cron-job.org
- Expected status: `200`
- Timeout: `30 to 45 seconds`
- Follow redirects: enabled

## Why Not GitHub Actions?

A scheduled GitHub Action every 10 minutes can run about 4,320 times per month. On private repositories, GitHub-hosted runner minutes count against the included monthly quota and can be billed after the quota is exhausted. The workflow in this repo is therefore manual-only.

## Limits

This is a demo workaround, not a production guarantee. Render Free can still restart during deploys, maintenance, or if free instance-hour limits are exhausted. Client UAT or production should use an always-on paid service or a small VPS.
