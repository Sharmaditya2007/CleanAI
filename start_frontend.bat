@echo off
title Clean AI - Frontend Dev Server
echo ========================================================
echo       CLEAN AI - SMART CIVIC SANITATION PLATFORM
echo               Starting Frontend Server
echo ========================================================
echo.

cd /d "%~dp0frontend"
echo [1/2] Checking Node.js environment...
node --version
npm --version

echo [2/2] Launching Vite Development Server on http://localhost:5173 ...
npm run dev
pause
