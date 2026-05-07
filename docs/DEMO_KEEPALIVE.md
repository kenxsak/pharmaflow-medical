# Demo Keepalive Setup

Render Free web services spin down after 15 minutes without inbound traffic. For a no-cost client demo, use an external uptime monitor instead of GitHub Actions so the repo does not burn Actions minutes.

## Recommended Free Setup

Use one of these:

- UptimeRobot free monitor, every 5 minutes
- cron-job.org free cron job, every 10 minutes

Ping this URL:

```text
https://pharmaflow-backend-vr51.onrender.com/actuator/health/liveness
```

Recommended settings:

- Method: `GET`
- Interval: `5 minutes` if using UptimeRobot, or `10 minutes` if using cron-job.org
- Expected status: `200`
- Timeout: `30 seconds`

## Why Not GitHub Actions?

A scheduled GitHub Action every 10 minutes can run about 4,320 times per month. On private repositories, GitHub-hosted runner minutes count against the included monthly quota and can be billed after the quota is exhausted. The workflow in this repo is therefore manual-only.

## Limits

This is a demo workaround, not a production guarantee. Render Free can still restart during deploys, maintenance, or if free instance-hour limits are exhausted. Client UAT or production should use an always-on paid service or a small VPS.
