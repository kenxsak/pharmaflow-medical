param(
  [string]$InstallDirectory = ".\.tools\koyeb-cli"
)

$ErrorActionPreference = "Stop"

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/koyeb/koyeb-cli/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match "windows_amd64\.zip$" } | Select-Object -First 1

if (-not $asset) {
  throw "Unable to find the Windows amd64 Koyeb CLI asset in the latest GitHub release."
}

$installRoot = Split-Path -Parent $InstallDirectory
$zipPath = Join-Path $installRoot "koyeb-cli.zip"

New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $InstallDirectory -Force

$binary = Get-ChildItem $InstallDirectory -Recurse -Filter "koyeb.exe" | Select-Object -First 1 -ExpandProperty FullName
if (-not $binary) {
  throw "Koyeb CLI was downloaded, but koyeb.exe was not found after extraction."
}

Write-Host "Koyeb CLI installed at $binary" -ForegroundColor Green
& $binary version
