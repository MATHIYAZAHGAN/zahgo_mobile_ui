@echo off
echo ============================================
echo ZAH Seller AI - Git Setup Script
echo ============================================
echo.

echo [1/5] Initializing Git repository...
git init
echo.

echo [2/5] Adding all files (respecting .gitignore)...
git add .
echo.

echo [3/5] Creating initial commit...
git commit -m "Initial commit: ZAH Seller AI - Mobile app and backend API"
echo.

echo [4/5] Checking Git status...
git status
echo.

echo ============================================
echo Git repository initialized successfully!
echo ============================================
echo.
echo NEXT STEPS:
echo 1. Create a repository on GitHub: https://github.com/new
echo 2. Run these commands to push your code:
echo.
echo    git remote add origin https://github.com/yourusername/zah-seller-ai.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo IMPORTANT: Make sure your .env files are NOT committed!
echo Check with: git status
echo.
pause
