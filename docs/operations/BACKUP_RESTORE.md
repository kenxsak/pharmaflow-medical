# Backup And Restore Runbook

## Local Docker backup

Create a PostgreSQL custom-format dump from the running local database:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\backup_postgres.ps1
```

Optional custom output path:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\backup_postgres.ps1 -BackupFile .\backups\pre-release.dump
```

## Local Docker restore

Restore a backup into the running local database container:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\restore_postgres.ps1 -BackupFile .\backups\pre-release.dump
```

## First paid customer operating rule

- Take a backup before every production deploy that includes schema changes.
- Keep at least:
  - 7 daily backups
  - 4 weekly backups
  - 3 monthly backups
- Test an actual restore at least once per month in a non-production database.
- Treat prescription/document storage separately from PostgreSQL backups.

## Production restore checklist

1. Pause traffic or maintenance-mode the frontend.
2. Confirm the target environment and backup timestamp.
3. Restore the PostgreSQL dump into the target database.
4. Run backend health checks and smoke checks.
5. Validate:
   - login
   - medicine search
   - billing history
   - inventory search
   - purchase order list
6. Resume traffic only after smoke checks pass.
