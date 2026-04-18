param(
  [string]$KoyebCliPath = ".\.tools\koyeb.exe",
  [string]$AppName = "pharmaflow",
  [string]$ServiceName = "backend",
  [string]$Repository = "github.com/kenxsak/pharmaflow-medical",
  [string]$Branch = "master",
  [ValidateSet("fra", "was")]
  [string]$Region = "fra",
  [string]$InstanceType = "free",
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUsername,
  [Parameter(Mandatory = $true)]
  [string]$DatabasePassword,
  [string]$FrontendUrl = "https://pharmaflow-medical.netlify.app",
  [string]$JwtSecret = ""
)

$ErrorActionPreference = "Stop"

function New-StrongSecret {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return [Convert]::ToBase64String($bytes)
}

if (-not (Test-Path $KoyebCliPath)) {
  throw "Koyeb CLI not found at '$KoyebCliPath'. Install it first, then rerun this script."
}

if (-not $JwtSecret) {
  $JwtSecret = New-StrongSecret
}

$frontendOrigin = $FrontendUrl.TrimEnd("/")
$corsOrigins = @(
  "https://*.netlify.app",
  "https://*.koyeb.app",
  $frontendOrigin,
  "http://localhost:3000",
  "http://localhost:3001"
) | Where-Object { $_ } | Sort-Object -Unique

$envValues = [ordered]@{
  SERVER_PORT = "8080"
  DATABASE_URL = $DatabaseUrl
  DATABASE_USERNAME = $DatabaseUsername
  DATABASE_PASSWORD = $DatabasePassword
  SPRING_DATASOURCE_HIKARI_POOL_NAME = "pharmaflow-koyeb"
  SPRING_DATASOURCE_APPLICATION_NAME = "pharmaflow-koyeb"
  SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE = "3"
  SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE = "0"
  SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT = "10000"
  SPRING_DATASOURCE_CONNECT_TIMEOUT = "10"
  SPRING_DATASOURCE_SOCKET_TIMEOUT = "30"
  SPRING_DATASOURCE_HIKARI_VALIDATION_TIMEOUT = "5000"
  SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT = "60000"
  HIBERNATE_DDL_AUTO = "validate"
  HIBERNATE_OPEN_IN_VIEW = "false"
  JDBC_SHOW_SQL = "false"
  PHARMAFLOW_REDIS_ENABLED = "false"
  REDIS_HEALTH = "false"
  PROMETHEUS_METRICS_EXPORT = "false"
  MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE = "health,info"
  MANAGEMENT_HEALTH_READINESS_INCLUDE = "readinessState,db"
  SECURITY_LOG_LEVEL = "INFO"
  PHARMAFLOW_SLOW_REQUEST_THRESHOLD_MS = "1500"
  CORS_ALLOWED_ORIGIN_PATTERNS = ($corsOrigins -join ",")
  PHARMAFLOW_STORAGE_PROVIDER = "local"
  PHARMAFLOW_STORAGE_LOCAL_ROOT = "/tmp/pharmaflow-documents"
  PHARMAFLOW_MEDICINE_AUTO_IMPORT = "false"
  JWT_SECRET = $JwtSecret
  PHARMAFLOW_BRAND_NAME = "PharmaFlow"
  PHARMAFLOW_BRAND_TAGLINE = "Retail pharmacy operations, billing, and compliance workspace"
  PHARMAFLOW_BRAND_SUPPORT_EMAIL = "support@pharmaflow.in"
  PHARMAFLOW_BRAND_SUPPORT_PHONE = "+91 44 4000 9000"
}

$serviceRef = "$AppName/$ServiceName"
$serviceExists = $false

try {
  & $KoyebCliPath services get $serviceRef --full | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $serviceExists = $true
  }
} catch {
  $serviceExists = $false
}

if (-not $serviceExists) {
  try {
    & $KoyebCliPath apps get $AppName --full | Out-Null
  } catch {
    Write-Host "Creating Koyeb app '$AppName'..." -ForegroundColor Cyan
    & $KoyebCliPath apps create $AppName
    if ($LASTEXITCODE -ne 0) {
      throw "Koyeb app creation failed."
    }
  }
}

$command = @($KoyebCliPath)

if ($serviceExists) {
  Write-Host "Updating existing Koyeb backend service $serviceRef..." -ForegroundColor Cyan
  $command += @(
    "services", "update", $serviceRef,
    "--git", $Repository,
    "--git-branch", $Branch,
    "--git-builder", "docker",
    "--git-workdir", "backend/pos-system",
    "--git-docker-dockerfile", "Dockerfile"
  )
} else {
  Write-Host "Creating Koyeb backend service $serviceRef..." -ForegroundColor Cyan
  $command += @(
    "services", "create", $ServiceName,
    "--app", $AppName,
    "--git", $Repository,
    "--git-branch", $Branch,
    "--git-builder", "docker",
    "--git-workdir", "backend/pos-system",
    "--git-docker-dockerfile", "Dockerfile"
  )
}

$command += @(
  "--instance-type", $InstanceType,
  "--regions", $Region,
  "--ports", "8080:http",
  "--routes", "/:8080",
  "--checks", "8080:http:/actuator/health/liveness",
  "--checks-grace-period", "8080=120"
)

foreach ($entry in $envValues.GetEnumerator()) {
  $command += @("--env", "$($entry.Key)=$($entry.Value)")
}

& $command[0] $command[1..($command.Count - 1)]

if ($LASTEXITCODE -ne 0) {
  throw "Koyeb backend deployment failed."
}

Write-Host ""
Write-Host "Backend service status:" -ForegroundColor Green
& $KoyebCliPath services get $serviceRef --full

Write-Host ""
Write-Host "Next step:" -ForegroundColor Green
Write-Host "When the backend URL is live, pass it to scripts/deploy_netlify_frontend.ps1 so Netlify points directly at the Koyeb API." -ForegroundColor White
