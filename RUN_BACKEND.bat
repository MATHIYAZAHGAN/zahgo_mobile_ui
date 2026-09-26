@echo off
echo.
echo ========================================
echo   Starting ZAH Seller AI Backend
echo ========================================
echo.

cd services\api

REM Set environment variables
set MONGODB_CONNECTION_STRING=mongodb://localhost:27017
set MONGODB_DATABASE_NAME=zahsellerai
set JWT_SECRET=ZahSellerAI-Super-Secret-Key-For-JWT-Tokens-Min-32-Chars-Required-2024
set JWT_ISSUER=ZahSellerAI
set JWT_AUDIENCE=ZahSellerAI-Mobile
set JWT_ACCESS_TOKEN_EXPIRY_MINUTES=60
set ASPNETCORE_URLS=http://0.0.0.0:5000
set CORS_ORIGINS=*

echo Starting Backend API...
echo.
echo API will be available at: http://localhost:5000
echo Swagger UI at: http://localhost:5000
echo.
echo Note: MongoDB connection will fail until MongoDB is installed.
echo The API will still start and Swagger will work.
echo.

dotnet run --project src\API

pause
