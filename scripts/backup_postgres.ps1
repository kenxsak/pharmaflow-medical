param(
    [string]$BackupFile = (Join-Path (Join-Path $PSScriptRoot "..\\backups") ("pharmaflow-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".dump")),
    [string]$ContainerName = "pharmaflow-db",
    [string]$DatabaseName = "pharmaflow",
    [string]$Username = "pharmaflow_user"
)

$resolvedBackupFile = [System.IO.Path]::GetFullPath($BackupFile)
$backupDirectory = Split-Path -Parent $resolvedBackupFile

if (-not (Test-Path $backupDirectory)) {
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
}

Write-Host "Creating PostgreSQL backup from container '$ContainerName' into '$resolvedBackupFile'..."

$command = "docker exec $ContainerName pg_dump -U $Username -d $DatabaseName -Fc > `"$resolvedBackupFile`""
cmd /c $command

if ($LASTEXITCODE -ne 0) {
    throw "Backup failed. Docker reported exit code $LASTEXITCODE."
}

Write-Host "Backup completed: $resolvedBackupFile"
