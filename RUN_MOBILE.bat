@echo off
echo.
echo ========================================
echo   Starting ZAH Seller AI Mobile App
echo ========================================
echo.

cd apps\mobile

echo Installing dependencies (first time)...
echo.
call npm install

echo.
echo Starting Expo development server...
echo.
echo After starting:
echo - Press 'a' for Android emulator
echo - Press 'i' for iOS simulator  
echo - Scan QR code for physical device
echo.

call npm start

pause
