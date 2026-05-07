param(
  [Parameter(Mandatory = $true)]
  [string]$BackendBaseUrl,
  [int]$TimeoutSec = 30,
  [switch]$SkipLegacyLoginChecks
)

$ErrorActionPreference = "Stop"

$backend = $BackendBaseUrl.TrimEnd("/")
$failures = New-Object System.Collections.Generic.List[string]

function Join-ApiUrl {
  param([string]$Path)
  if ($Path.StartsWith("http://") -or $Path.StartsWith("https://")) {
    return $Path
  }
  return "$backend/$($Path.TrimStart('/'))"
}

function Invoke-ApiRequest {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $uri = Join-ApiUrl $Path
  $request = @{
    Uri = $uri
    Method = $Method
    Headers = $Headers
    TimeoutSec = $TimeoutSec
    UseBasicParsing = $true
  }

  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = ($Body | ConvertTo-Json -Depth 12)
  }

  try {
    $response = Invoke-WebRequest @request
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
      try {
        $parsed = ConvertFrom-Json -InputObject $response.Content
      } catch {
        $parsed = $response.Content
      }
    }
    return [pscustomobject]@{
      Ok = $true
      StatusCode = [int]$response.StatusCode
      Body = $parsed
      RawBody = $response.Content
      Headers = $response.Headers
      Uri = $uri
    }
  } catch {
    $statusCode = 0
    $rawBody = ""
    if ($_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $rawBody = $reader.ReadToEnd()
        }
      } catch {
        $rawBody = $_.Exception.Message
      }
    }
    return [pscustomobject]@{
      Ok = $false
      StatusCode = $statusCode
      Body = $null
      RawBody = $rawBody
      Headers = @{}
      Uri = $uri
      Error = $_.Exception.Message
    }
  }
}

function Assert-Step {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Details = ""
  )

  if ($Passed) {
    Write-Host "[PASS] $Name" -ForegroundColor Green
    if ($Details) {
      Write-Host "       $Details" -ForegroundColor DarkGray
    }
    return
  }

  Write-Host "[FAIL] $Name" -ForegroundColor Red
  if ($Details) {
    Write-Host "       $Details" -ForegroundColor DarkGray
  }
  $failures.Add("$Name :: $Details") | Out-Null
}

function New-PharmaHeaders {
  param(
    [string]$Token,
    [string]$StoreId = "",
    [string]$TenantId = "",
    [string]$TenantSlug = ""
  )

  $headers = @{
    Authorization = "Bearer $Token"
    "X-Brand-Name" = "MedInOne"
    "X-Brand-Tagline" = "One connected workspace for pharmacy billing, inventory, compliance, and delivery"
    "X-Brand-Support-Email" = "support@medinone.in"
    "X-Brand-Support-Phone" = "+91 44 4000 9000"
  }

  if ($StoreId) {
    $headers["X-Store-ID"] = $StoreId
  }
  if ($TenantId) {
    $headers["X-Tenant-ID"] = $TenantId
  }
  if ($TenantSlug) {
    $headers["X-Tenant-Slug"] = $TenantSlug
  }

  return $headers
}

Write-Host "Smoke testing MedInOne backend: $backend" -ForegroundColor Cyan
Write-Host ""

$liveness = Invoke-ApiRequest -Method GET -Path "/actuator/health/liveness"
Assert-Step "backend liveness" ($liveness.Ok -and $liveness.StatusCode -eq 200) "status=$($liveness.StatusCode) uri=$($liveness.Uri)"

$readiness = Invoke-ApiRequest -Method GET -Path "/actuator/health/readiness"
Assert-Step "backend readiness" ($readiness.Ok -and $readiness.StatusCode -eq 200) "status=$($readiness.StatusCode) uri=$($readiness.Uri)"

$modernLogins = @(
  @{
    Name = "SaaS admin"
    Username = "admin"
    Password = "Admin@123"
    TenantSlug = "pharmaflow"
    ExpectedRole = "SUPER_ADMIN"
    ExpectedPlatformOwner = $true
    ExpectMedicineResults = $true
  },
  @{
    Name = "Company admin"
    Username = "manager@medinone.in"
    Password = "Company@123"
    TenantSlug = "pharmaflow"
    ExpectedRole = "STORE_MANAGER"
    ExpectedPlatformOwner = $false
    ExpectMedicineResults = $true
  },
  @{
    Name = "Store operator"
    Username = "store@medinone.in"
    Password = "Store@123"
    TenantSlug = "pharmaflow"
    ExpectedRole = "PHARMACIST"
    ExpectedPlatformOwner = $false
    ExpectMedicineResults = $true
  },
  @{
    Name = "Second tenant company admin"
    Username = "manager@posible.in"
    Password = "Company@123"
    TenantSlug = "posible-rx"
    ExpectedRole = "STORE_MANAGER"
    ExpectedPlatformOwner = $false
    ExpectMedicineResults = $false
  }
)

foreach ($login in $modernLogins) {
  $body = @{
    username = $login.Username
    password = $login.Password
    tenantSlug = $login.TenantSlug
  }
  $response = Invoke-ApiRequest -Method POST -Path "/api/v1/auth/login" -Body $body
  $token = if ($response.Body) { $response.Body.token } else { "" }
  $role = if ($response.Body) { $response.Body.role } else { "" }
  $platformOwner = if ($response.Body) { [bool]$response.Body.platformOwner } else { $false }

  Assert-Step "$($login.Name) login" (
    $response.Ok -and
    $response.StatusCode -eq 200 -and
    -not [string]::IsNullOrWhiteSpace($token) -and
    $role -eq $login.ExpectedRole -and
    $platformOwner -eq $login.ExpectedPlatformOwner
  ) "status=$($response.StatusCode) role=$role platformOwner=$platformOwner"

  if (-not $response.Ok -or [string]::IsNullOrWhiteSpace($token)) {
    continue
  }

  $storeId = $response.Body.storeId
  $tenantId = $response.Body.tenantId
  $tenantSlug = $response.Body.tenantSlug
  $headers = New-PharmaHeaders -Token $token -StoreId $storeId -TenantId $tenantId -TenantSlug $tenantSlug

  $stores = Invoke-ApiRequest -Method GET -Path "/api/v1/stores" -Headers $headers
  $storeCount = if ($stores.Body -is [array]) { $stores.Body.Count } elseif ($stores.Body) { 1 } else { 0 }
  Assert-Step "$($login.Name) can load stores" ($stores.Ok -and $stores.StatusCode -eq 200 -and $storeCount -gt 0) "status=$($stores.StatusCode) count=$storeCount"

  $searchPath = "/api/v1/medicines/search?q=$([uri]::EscapeDataString('crocine'))"
  $search = Invoke-ApiRequest -Method GET -Path $searchPath -Headers $headers
  $searchCount = if ($search.Body -is [array]) { $search.Body.Count } elseif ($search.Body) { 1 } else { 0 }
  $firstMedicine = if ($searchCount -gt 0 -and $search.Body[0]) { $search.Body[0].brandName } else { "" }
  $expectMedicineResults = if ($login.ContainsKey("ExpectMedicineResults")) { [bool]$login.ExpectMedicineResults } else { $true }
  Assert-Step "$($login.Name) typo-tolerant medicine search" (
    $search.Ok -and
    $search.StatusCode -eq 200 -and
    (-not $expectMedicineResults -or $searchCount -gt 0)
  ) "status=$($search.StatusCode) count=$searchCount first=$firstMedicine"

  $suppliers = Invoke-ApiRequest -Method GET -Path "/api/v1/purchases/suppliers" -Headers $headers
  $supplierCount = if ($suppliers.Body -is [array]) { $suppliers.Body.Count } elseif ($suppliers.Body) { 1 } else { 0 }
  Assert-Step "$($login.Name) can load suppliers" ($suppliers.Ok -and $suppliers.StatusCode -eq 200) "status=$($suppliers.StatusCode) count=$supplierCount"
}

$driverBody = @{
  username = "driver@medinone.in"
  password = "Driver@123"
  tenantSlug = "pharmaflow"
}
$driver = Invoke-ApiRequest -Method POST -Path "/api/v1/auth/login" -Body $driverBody
$driverToken = if ($driver.Body) { $driver.Body.token } else { "" }
$driverRole = if ($driver.Body) { $driver.Body.role } else { "" }
Assert-Step "Delivery rider login" (
  $driver.Ok -and
  $driver.StatusCode -eq 200 -and
  -not [string]::IsNullOrWhiteSpace($driverToken) -and
  $driverRole -eq "DELIVERY_BOY"
) "status=$($driver.StatusCode) role=$driverRole"

if ($driver.Ok -and -not [string]::IsNullOrWhiteSpace($driverToken)) {
  $driverHeaders = New-PharmaHeaders `
    -Token $driverToken `
    -StoreId $driver.Body.storeId `
    -TenantId $driver.Body.tenantId `
    -TenantSlug $driver.Body.tenantSlug

  $deliverySummary = Invoke-ApiRequest -Method GET -Path "/api/v1/deliveries/summary" -Headers $driverHeaders
  Assert-Step "Delivery rider can load delivery summary" (
    $deliverySummary.Ok -and
    $deliverySummary.StatusCode -eq 200
  ) "status=$($deliverySummary.StatusCode)"

  $deliveryQueue = Invoke-ApiRequest -Method GET -Path "/api/v1/deliveries?limit=25" -Headers $driverHeaders
  $deliveryCount = if ($deliveryQueue.Body -is [array]) { $deliveryQueue.Body.Count } elseif ($deliveryQueue.Body) { 1 } else { 0 }
  Assert-Step "Delivery rider can load delivery queue" (
    $deliveryQueue.Ok -and
    $deliveryQueue.StatusCode -eq 200
  ) "status=$($deliveryQueue.StatusCode) count=$deliveryCount"

  $deliveryDrivers = Invoke-ApiRequest -Method GET -Path "/api/v1/deliveries/drivers" -Headers $driverHeaders
  $deliveryDriverCount = if ($deliveryDrivers.Body -is [array]) { $deliveryDrivers.Body.Count } elseif ($deliveryDrivers.Body) { 1 } else { 0 }
  Assert-Step "Delivery rider can load rider roster" (
    $deliveryDrivers.Ok -and
    $deliveryDrivers.StatusCode -eq 200 -and
    $deliveryDriverCount -gt 0
  ) "status=$($deliveryDrivers.StatusCode) count=$deliveryDriverCount"
}

if (-not $SkipLegacyLoginChecks) {
  $legacyLogins = @(
    @{
      Name = "Legacy owner"
      Email = "owner@medinone.in"
      Password = "admin123"
      Pin = 1234
    },
    @{
      Name = "Legacy cashier"
      Email = "cashier@medinone.in"
      Password = "password123"
      Pin = 4321
    }
  )

  foreach ($login in $legacyLogins) {
    $legacyBody = @{
      employerEmail = $login.Email
      employerPassword = $login.Password
    }
    $legacy = Invoke-ApiRequest -Method POST -Path "/lifepill/v1/auth/authenticate" -Body $legacyBody
    $legacyToken = if ($legacy.Body) { $legacy.Body.authenticationResponse.access_token } else { "" }
    Assert-Step "$($login.Name) legacy login" (
      $legacy.Ok -and
      $legacy.StatusCode -eq 200 -and
      -not [string]::IsNullOrWhiteSpace($legacyToken)
    ) "status=$($legacy.StatusCode)"

    if (-not $legacy.Ok) {
      continue
    }

    $pinBody = @{
      username = $login.Email
      pin = $login.Pin
    }
    $pin = Invoke-ApiRequest -Method POST -Path "/lifepill/v1/session/authenticate/cached" -Body $pinBody
    $pinToken = if ($pin.Body) { $pin.Body.authenticationResponse.access_token } else { "" }
    Assert-Step "$($login.Name) cached PIN login" (
      $pin.Ok -and
      $pin.StatusCode -eq 200 -and
      -not [string]::IsNullOrWhiteSpace($pinToken)
    ) "status=$($pin.StatusCode)"
  }
}

Write-Host ""
if ($failures.Count -gt 0) {
  Write-Host "Smoke test failed with $($failures.Count) issue(s):" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Smoke test passed. Hosted login + core API flow is healthy." -ForegroundColor Green
