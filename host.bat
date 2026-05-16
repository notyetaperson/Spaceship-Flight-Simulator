@echo off
title Space Game Dev Server
echo.
echo ================================================
echo    Space Game - Local Development Server
echo ================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Install Python and add it to PATH.
    pause
    exit
)

echo Server starting on http://localhost:8080
echo Press Ctrl+C to stop...
echo.

python -m http.server 8080