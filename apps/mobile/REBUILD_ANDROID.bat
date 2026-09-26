@echo off
echo ========================================
echo   REBUILDING ANDROID APP
echo ========================================
echo.

echo [1/6] Cleaning Android build folder...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"

echo [2/6] Clearing .expo folder...
if exist ".expo" rmdir /s /q ".expo"

echo [3/6] Clearing Metro cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo [4/6] Running prebuild to regenerate native folders...
call npx expo prebuild --clean

echo [5/6] Building Android APK...
echo.
echo NOTE: Make sure to UNINSTALL the old app from your phone first!
echo.
call npx expo run:android

echo.
echo ========================================
echo   BUILD COMPLETE
echo ========================================
pause
