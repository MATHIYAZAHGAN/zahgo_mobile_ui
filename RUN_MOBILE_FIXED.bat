@echo off
echo ========================================
echo   ZAH SELLER AI - MOBILE APP (FIXED)
echo ========================================
echo.
echo Starting Metro Bundler in OFFLINE mode...
echo (No Expo account required)
echo.

cd apps\mobile
call npm start -- --offline --port 8082

echo.
echo Mobile app stopped.
pause
