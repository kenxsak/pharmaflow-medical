param(
    [string]$DatasetRoot = (Join-Path $PSScriptRoot '..\backend\pos-system\import-data'),
    [string]$DatasetFile = 'updated_indian_medicine_data.csv',
    [string]$PostgresContainer = 'pharmaflow-db',
    [string]$Database = 'pharmaflow',
    [string]$Username = 'pharmaflow_user',
    [switch]$SkipSubstitutes
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$csvPath = Join-Path $DatasetRoot $DatasetFile
$legacyCsvPath = Join-Path (Join-Path $PSScriptRoot '..\external\Indian-Medicine-Dataset') "DATA\$DatasetFile"
$importSqlPath = Join-Path $PSScriptRoot 'sql\import_indian_medicine_dataset.sql'
$substituteSqlPath = Join-Path $PSScriptRoot 'sql\build_medicine_substitutes.sql'

if (-not (Test-Path $csvPath)) {
    if (Test-Path $legacyCsvPath) {
        $csvPath = $legacyCsvPath
    } else {
        throw "Dataset file not found. Checked: $csvPath and $legacyCsvPath"
    }
}

if (-not (Test-Path $importSqlPath)) {
    throw "Import SQL not found: $importSqlPath"
}

if (-not (Test-Path $substituteSqlPath)) {
    throw "Substitute SQL not found: $substituteSqlPath"
}

Write-Host "Copying dataset into PostgreSQL container from $csvPath"
docker cp $csvPath "${PostgresContainer}:/tmp/staging_indian_medicine_data.csv"
if ($LASTEXITCODE -ne 0) { throw "Failed to copy dataset into container." }

Write-Host "Copying SQL scripts into PostgreSQL container"
docker cp $importSqlPath "${PostgresContainer}:/tmp/import_indian_medicine_dataset.sql"
if ($LASTEXITCODE -ne 0) { throw "Failed to copy import SQL into container." }
docker cp $substituteSqlPath "${PostgresContainer}:/tmp/build_medicine_substitutes.sql"
if ($LASTEXITCODE -ne 0) { throw "Failed to copy substitute SQL into container." }

Write-Host 'Running medicine import...'
docker exec $PostgresContainer psql -U $Username -d $Database -v ON_ERROR_STOP=1 -f /tmp/import_indian_medicine_dataset.sql
if ($LASTEXITCODE -ne 0) { throw "Medicine import failed." }

if (-not $SkipSubstitutes) {
    Write-Host 'Running substitute builder...'
    docker exec $PostgresContainer psql -U $Username -d $Database -v ON_ERROR_STOP=1 -f /tmp/build_medicine_substitutes.sql
    if ($LASTEXITCODE -ne 0) { throw "Substitute builder failed." }
}

Write-Host 'Final catalogue summary:'
docker exec $PostgresContainer psql -U $Username -d $Database -c "SELECT catalog_source, COUNT(*) AS medicine_count FROM medicines GROUP BY catalog_source ORDER BY catalog_source;"
if ($LASTEXITCODE -ne 0) { throw "Failed to read medicine summary." }
docker exec $PostgresContainer psql -U $Username -d $Database -c "SELECT COUNT(*) AS manufacturer_count FROM manufacturers;"
if ($LASTEXITCODE -ne 0) { throw "Failed to read manufacturer summary." }
docker exec $PostgresContainer psql -U $Username -d $Database -c "SELECT COUNT(*) AS salt_count FROM salt_compositions;"
if ($LASTEXITCODE -ne 0) { throw "Failed to read salt summary." }
docker exec $PostgresContainer psql -U $Username -d $Database -c "SELECT COUNT(*) AS substitute_count FROM medicine_substitutes;"
if ($LASTEXITCODE -ne 0) { throw "Failed to read substitute summary." }
