# Phase 1 First-Customer Hardening

This repo now includes the core Phase 1 implementation path:

- Flyway migration support with baseline-on-migrate
- Hibernate schema validation by default
- prescription/document upload and retrieval with local fallback plus S3-ready storage
- root CI workflow
- PostgreSQL backup and restore scripts

## Required environment setup before the first paid customer

### Database

- Use a managed PostgreSQL instance.
- Keep `HIBERNATE_DDL_AUTO=validate`.
- Keep `FLYWAY_ENABLED=true`.

### Document storage

- Set `PHARMAFLOW_STORAGE_PROVIDER=s3`
- Configure:
  - `AWS_ACCESS_KEY`
  - `AWS_SECRET_KEY`
  - `AWS_S3_BUCKET`
  - `AWS_REGION`

If those S3 values are blank, the app falls back to local disk storage. That is fine for local demo use, but not acceptable for a paid production tenant.

### Monitoring

- Keep `/actuator/health` exposed to the hosting platform.
- Alert on:
  - backend health failures
  - database connectivity failures
  - disk/storage write failures
  - repeated 5xx responses

## Mandatory UAT before first paid customer

1. SaaS admin login and company/store visibility
2. Company admin login and store-restricted visibility
3. Store login and store-only visibility
4. Customer create and edit
5. Purchase inward from catalog medicine
6. Billing with substitute replace/add
7. Controlled-drug billing with uploaded prescription
8. Compliance register opens the uploaded prescription
9. Customer history opens the uploaded prescription
10. Invoice audit opens the uploaded prescription
11. Transfer request to receive lifecycle
12. Reorder draft creation
