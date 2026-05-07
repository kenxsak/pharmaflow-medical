param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,
  [string]$DeploymentMode = "Cloud demo on Netlify + Koyeb"
)

$ErrorActionPreference = "Stop"

$backend = $BackendBaseUrl.TrimEnd("/")

$envCommands = @(
  @("REACT_APP_BACKEND_URL", $backend),
  @("REACT_APP_API_URL", "$backend/api/v1"),
  @("REACT_APP_LEGACY_API_URL", "$backend/lifepill/v1"),
  @("REACT_APP_WS_URL", "$backend/ws"),
  @("REACT_APP_BRAND_NAME", "MedInOne"),
  @("REACT_APP_STORE_NAME", "MedInOne"),
  @("REACT_APP_BRAND_TAGLINE", "One connected workspace for pharmacy billing, inventory, compliance, and delivery"),
  @("REACT_APP_BRAND_SUPPORT_EMAIL", "support@medinone.in"),
  @("REACT_APP_BRAND_SUPPORT_PHONE", "+91 44 4000 9000"),
  @("REACT_APP_BRAND_DEPLOYMENT_MODE", $DeploymentMode)
)

foreach ($pair in $envCommands) {
  Set-Item -Path "Env:\$($pair[0])" -Value $pair[1]
  Write-Host "Setting Netlify env $($pair[0])..." -ForegroundColor Cyan
  & "C:\Program Files\nodejs\npx.cmd" netlify-cli env:set $pair[0] $pair[1] --context production --scope builds
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set Netlify env $($pair[0])."
  }
}

Write-Host "Production build API base: $env:REACT_APP_API_URL" -ForegroundColor Cyan
Write-Host "Deploying Netlify frontend..." -ForegroundColor Cyan
& "C:\Program Files\nodejs\npx.cmd" netlify-cli deploy --prod --build

if ($LASTEXITCODE -ne 0) {
  throw "Netlify production deploy failed."
}

Write-Host ""
Write-Host "Netlify frontend updated to use $backend" -ForegroundColor Green
