@echo off
echo ========================================
echo   ZAH SELLER AI - WEB VERSION
echo ========================================
echo.

echo [1/3] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/3] Clearing caches...
if exist ".expo" rmdir /s /q ".expo"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo [3/3] Starting web version...
echo.
echo ========================================
echo   Browser will open automatically
echo   All features work perfectly!
echo ========================================
echo.

npm run web

pause
