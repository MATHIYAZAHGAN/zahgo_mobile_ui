@echo off
echo.
echo ========================================
echo   ZAH Seller AI - Fresh Start
echo ========================================
echo.
echo Cleaning up and starting fresh...
echo.

cd /d "%~dp0apps\mobile"

echo Removing .expo folder...
rmdir /s /q .expo 2>nul

echo.
echo Starting Expo with clean cache...
echo.
npm start -- --clear

pause
