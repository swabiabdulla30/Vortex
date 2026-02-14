@echo off
echo Starting Vortex Backend Server...
echo.
echo =======================================================
echo NOTE: If this is your first time running this,
echo it may take 5-10 minutes to download the database (~780MB).
echo Please be patient. Do not close this window.
echo =======================================================
echo.

REM Add Node.js to PATH for this session
set PATH=%PATH%;C:\Program Files\nodejs

node server.js
if %errorlevel% neq 0 (
    echo.
    echo Error occurred. Press any key to exit.
    pause
)
