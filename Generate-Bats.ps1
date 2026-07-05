<#
  phones.csv poRe protita phone-er jonno "Open-<Name>.bat" toiri kore.
  Purono Open-*.bat mucche notun kore banay.
#>
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$csv  = Join-Path $root "phones.csv"
if (-not (Test-Path $csv)) { Write-Host "phones.csv nai!" -ForegroundColor Red; exit 1 }

# purono generated bats muche felo
Get-ChildItem $root -Filter "Open-*.bat" -ErrorAction SilentlyContinue | Remove-Item -Force

$rows = Import-Csv $csv | Where-Object {
    $_.Name -and $_.Name.Trim() -and -not $_.Name.Trim().StartsWith("#") -and $_.TailscaleIP -and $_.TailscaleIP.Trim() -and -not $_.TailscaleIP.Trim().StartsWith("#")
}

if (-not $rows) { Write-Host "phones.csv te kono valid phone nai. Name,IP add koro." -ForegroundColor Yellow; exit 0 }

$count = 0
foreach ($r in $rows) {
    $name = $r.Name.Trim()
    $ip   = $r.TailscaleIP.Trim()
    $safe = ($name -replace '[^\w\-]', '_')
    $bat  = Join-Path $root "Open-$safe.bat"
    $content = @"
@echo off
title $name
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0Connect-Phone.ps1" -IP $ip -Title "$name"
"@
    Set-Content -Path $bat -Value $content -Encoding ASCII
    Write-Host "  [+] Open-$safe.bat   ->  $ip" -ForegroundColor Green
    $count++
}
Write-Host "`n$count ta phone-er .bat toiri holo. Ekhon double-click korei connect + scrcpy." -ForegroundColor Cyan
