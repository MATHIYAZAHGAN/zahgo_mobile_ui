@echo off
echo ========================================
echo ZAH SELLER AI - Initial Setup Script
echo ========================================
echo.

echo Step 1: Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
node --version

REM Check .NET
where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] .NET SDK is not installed!
    echo Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)
echo [OK] .NET SDK is installed
dotnet --version

REM Check MongoDB
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB is not installed or not in PATH
    echo Please install MongoDB from https://www.mongodb.com/try/download/community
    echo Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:7.0
) else (
    echo [OK] MongoDB is installed
)

echo.
echo Step 2: Setting up Backend API...
echo.

cd services\api

if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo [INFO] Please configure .env file with your settings
)

echo Installing .NET dependencies...
dotnet restore

echo.
echo Step 3: Setting up Mobile App...
echo.

cd ..\..\apps\mobile

echo Installing Node.js dependencies...
call npm install

echo.
echo ========================================
echo Setup Complete! 
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Configure services/api/.env file with:
echo    - MongoDB connection string
echo    - JWT secret
echo    - AI provider API keys
echo.
echo 2. Start MongoDB:
echo    mongod
echo    (or) docker run -d -p 27017:27017 --name mongodb mongo:7.0
echo.
echo 3. Start Backend API:
echo    cd services\api
echo    dotnet run --project src\API
echo    API will run at http://localhost:5000
echo.
echo 4. Start Mobile App:
echo    cd apps\mobile
echo    npm start
echo    Then press 'a' for Android or 'i' for iOS
echo.
echo For detailed instructions, see docs/SETUP_GUIDE.md
echo.
pause
