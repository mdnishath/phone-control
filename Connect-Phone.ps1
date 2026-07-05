<#
  Connect-Phone.ps1
  Ekta phone Tailscale IP diye connect kore scrcpy chalu kore.

  Usage:
    powershell -ExecutionPolicy Bypass -File Connect-Phone.ps1 -IP 100.101.102.103
    powershell -ExecutionPolicy Bypass -File Connect-Phone.ps1 -IP 100.101.102.103 -Title "Phone-01"
#>
param(
    [Parameter(Mandatory = $true)] [string]$IP,
    [int]$Port = 5555,
    [string]$Title = "",
    # auto = network bujhe nijei thik korbe (Wi-Fi=HD, mobile data=low)
    # high = jor kore HD ; low = jor kore low-res
    [ValidateSet("auto","high","low")] [string]$Quality = "auto"
)

# --- scrcpy / adb khuje ber koro (winget install location) ---
$scrcpyDir = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "scrcpy.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty DirectoryName
if (-not $scrcpyDir) { Write-Host "scrcpy pawa jaini! winget install Genymobile.scrcpy chalao." -ForegroundColor Red; pause; exit 1 }

$adb    = Join-Path $scrcpyDir "adb.exe"
$scrcpy = Join-Path $scrcpyDir "scrcpy.exe"
$target = "${IP}:${Port}"
if (-not $Title) { $Title = $target }

Write-Host "==> Tailscale check..." -ForegroundColor Cyan
$ts = "C:\Program Files\Tailscale\tailscale.exe"
if (Test-Path $ts) {
    $state = (& $ts status 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $state) {
        Write-Host "Tailscale off mne hoy. 'tailscale up' cholabe? logging in..." -ForegroundColor Yellow
        & $ts up 2>$null
    }
}

Write-Host "==> $Title  ($target) connect kortesi..." -ForegroundColor Cyan
& $adb connect $target | Out-Host

# reachable kina check
$ok = $false
for ($i = 0; $i -lt 3; $i++) {
    $list = & $adb devices
    if ($list -match [regex]::Escape($target) -and $list -match "$([regex]::Escape($target))\s+device") { $ok = $true; break }
    Start-Sleep -Seconds 2
    & $adb connect $target | Out-Null
}

if (-not $ok) {
    Write-Host "CONNECT HOYNI: $target" -ForegroundColor Red
    Write-Host "  - Phone-e Tailscale ON to?  (PC ar phone same account e?)" -ForegroundColor Yellow
    Write-Host "  - Wireless debugging / adb tcpip 5555 phone-e enable to?" -ForegroundColor Yellow
    Write-Host "  - IP thik? ($IP)" -ForegroundColor Yellow
    pause; exit 1
}

# --- Network quality auto-detect (Wi-Fi=direct=fast, mobile data=DERP relay=slow) ---
$mode = $Quality
if ($Quality -eq "auto" -and (Test-Path $ts)) {
    Write-Host "==> Network check (direct na relay?)..." -ForegroundColor Cyan
    $ping = & $ts ping $IP 2>$null      # direct hole "via <ip>:port", relay hole "via DERP(..)"
    $lastPong = ($ping | Select-String -Pattern "pong from" | Select-Object -Last 1)
    $lastPong = if ($lastPong) { $lastPong.ToString() } else { "" }
    if ($lastPong -match "via DERP") {
        $mode = "low"
        Write-Host "   RELAY (mobile data/CGNAT) -- slow link. LOW-res mode." -ForegroundColor Yellow
    } elseif ($lastPong -match "via ") {
        $mode = "high"
        Write-Host "   DIRECT (Wi-Fi) -- fast link. HD mode.  [$lastPong]" -ForegroundColor Green
    } else {
        $mode = "low"   # ping fail -> safe low
        Write-Host "   Ping unclear -- safe LOW-res mode." -ForegroundColor Yellow
    }
}

# scrcpy arguments ekta array-te (native command array auto-expand kore)
$sargs = @('-s', $target, "--window-title=$Title")
if ($mode -eq "high") {
    $sargs += @('--max-size=1280','--video-bit-rate=6M','--max-fps=60')          # Wi-Fi/direct: HD
} else {
    $sargs += @('--max-size=800','--video-bit-rate=1M','--max-fps=24','--video-codec=h265')  # relay: low bandwidth
}
$sargs += @('--stay-awake','--turn-screen-off','--power-off-on-close')

Write-Host "==> scrcpy chalu: $Title  [$mode]" -ForegroundColor Green
& $scrcpy $sargs
