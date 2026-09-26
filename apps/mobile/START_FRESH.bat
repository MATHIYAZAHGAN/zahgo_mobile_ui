@echo off
echo ========================================
echo   ZAH SELLER AI - CLEAN START
echo ========================================
echo.

echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/5] Clearing .expo folder...
if exist ".expo" rmdir /s /q ".expo"

echo [3/5] Clearing Metro cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo [4/5] Clearing temp files...
if exist "%TEMP%\metro-*" del /q "%TEMP%\metro-*" >nul 2>&1
if exist "%TEMP%\react-*" del /q "%TEMP%\react-*" >nul 2>&1

echo [5/5] Starting Expo with clear flag...
echo.
echo ========================================
echo   Starting Metro Bundler...
echo   After QR code appears, press 'w' for web
echo ========================================
echo.

npm start -- --clear

pause
