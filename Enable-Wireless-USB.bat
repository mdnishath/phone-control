@echo off
REM ===== EK-BAR-ER SETUP (phone PC-te USB cable diye lagano thakle) =====
REM Phone-take "adb over Wi-Fi / tcpip 5555" mode e dhukiye dey.
REM France pathanor AGE protita phone ekbar eta cholaba (ba rooted hole app diye permanent).
setlocal
for /f "tokens=*" %%D in ('dir /s /b "%LOCALAPPDATA%\Microsoft\WinGet\Packages\adb.exe" 2^>nul') do set ADB=%%D
if "%ADB%"=="" set ADB=adb
echo === Connected USB devices ===
"%ADB%" devices -l
echo.
echo === tcpip 5555 mode enable kortesi (shob USB device) ===
"%ADB%" tcpip 5555
echo.
echo Done. Ekhon phone-e Tailscale ON kore France-e nite paro.
echo Cable khule Wi-Fi te thakle: connect hobe  adb connect ^<tailscale-ip^>:5555
pause
