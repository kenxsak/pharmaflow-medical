param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ContainerName = "pharmaflow-db",
    [string]$DatabaseName = "pharmaflow",
    [string]$Username = "pharmaflow_user"
)

$resolvedBackupFile = [System.IO.Path]::GetFullPath($BackupFile)

if (-not (Test-Path $resolvedBackupFile)) {
    throw "Backup file not found: $resolvedBackupFile"
}

$containerBackupPath = "/tmp/pharmaflow-restore.dump"

Write-Host "Copying '$resolvedBackupFile' into '$ContainerName:$containerBackupPath'..."
& docker cp $resolvedBackupFile "${ContainerName}:${containerBackupPath}"
if ($LASTEXITCODE -ne 0) {
    throw "Unable to copy backup file into the PostgreSQL container."
}

Write-Host "Restoring PostgreSQL backup into database '$DatabaseName'..."
& docker exec $ContainerName pg_restore -U $Username --clean --if-exists -d $DatabaseName $containerBackupPath
if ($LASTEXITCODE -ne 0) {
    throw "Restore failed. PostgreSQL reported exit code $LASTEXITCODE."
}

Write-Host "Removing temporary backup file from container..."
& docker exec $ContainerName rm -f $containerBackupPath | Out-Null

Write-Host "Restore completed from: $resolvedBackupFile"
