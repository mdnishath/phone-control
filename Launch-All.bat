@echo off
REM phones.csv-er SHOB phone ek sathe connect kore protita-r scrcpy window khule.
powershell -ExecutionPolicy Bypass -NoProfile -Command ^
 "Import-Csv '%~dp0phones.csv' | Where-Object { $_.Name -and $_.Name.Trim() -and -not $_.Name.Trim().StartsWith('#') -and $_.TailscaleIP -and -not $_.TailscaleIP.Trim().StartsWith('#') } | ForEach-Object { Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-NoProfile','-File','%~dp0Connect-Phone.ps1','-IP',$_.TailscaleIP.Trim(),'-Title',$_.Name.Trim() ; Start-Sleep -Milliseconds 800 }"
