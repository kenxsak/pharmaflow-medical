param(
  [string]$KoyebCliPath = ".\.tools\koyeb.exe",
  [string]$AppName = "pharmaflow",
  [string]$DatabaseServiceName = "pharmaflow-db",
  [string]$DatabaseName = "pharmaflow",
  [string]$DatabaseOwner = "pharmaflow_user",
  [ValidateSet("fra", "was", "sin")]
  [string]$Region = "fra",
  [ValidateSet("free", "small", "medium", "large")]
  [string]$InstanceType = "free"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KoyebCliPath)) {
  throw "Koyeb CLI not found at '$KoyebCliPath'. Install it first, then rerun this script."
}

$databaseRef = "$AppName/$DatabaseServiceName"
$databaseExists = $false

try {
  & $KoyebCliPath databases get $databaseRef --full | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $databaseExists = $true
  }
} catch {
  $databaseExists = $false
}

if ($databaseExists) {
  Write-Host "Koyeb database already exists: $databaseRef" -ForegroundColor Yellow
} else {
  Write-Host "Creating Koyeb database $databaseRef in region '$Region'..." -ForegroundColor Cyan
  & $KoyebCliPath databases create $DatabaseServiceName `
    --app $AppName `
    --db-name $DatabaseName `
    --db-owner $DatabaseOwner `
    --instance-type $InstanceType `
    --region $Region

  if ($LASTEXITCODE -ne 0) {
    throw "Koyeb database creation failed."
  }
}

Write-Host ""
Write-Host "Database status:" -ForegroundColor Green
& $KoyebCliPath databases get $databaseRef --full

Write-Host ""
Write-Host "Next step:" -ForegroundColor Green
Write-Host "Copy the database connection details from the Koyeb dashboard or CLI output and pass them to scripts/deploy_koyeb_backend.ps1." -ForegroundColor White
