@echo off
echo.
echo ========================================
echo   ZAH Seller AI - Starting Web Version
echo ========================================
echo.
echo Starting API Backend and Mobile App...
echo.
echo Open these in separate terminals:
echo.
echo Terminal 1 - API Backend:
echo    cd services\api
echo    dotnet run --project src\API
echo.
echo Terminal 2 - Mobile App (Web):
echo    cd apps\mobile
echo    npm start --web
echo.
echo ========================================
echo   Press any key to open both terminals
echo ========================================
pause

start cmd /k "cd /d services\api && dotnet run --project src\API"
timeout /t 3
start cmd /k "cd /d apps\mobile && npm start -- --web"

echo.
echo Both services starting...
echo Wait for browser to open automatically!
echo.
