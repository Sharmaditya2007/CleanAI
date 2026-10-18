@echo off
title Clean AI - Full Stack Launcher
echo ========================================================
echo       CLEAN AI - SMART CIVIC SANITATION PLATFORM
echo          Smarter Toilets. Cleaner Cities.
echo ========================================================
echo.
echo Launching Backend and Frontend in separate windows...
echo.

start "Clean AI Backend API" cmd /k "call "%~dp0start_backend.bat""
timeout /t 3 /nobreak > nul

start "Clean AI Frontend Web" cmd /k "call "%~dp0start_frontend.bat""

echo.
echo ========================================================
echo Services successfully launched:
echo   - Frontend Portal:     http://localhost:5173
echo   - Backend API:         http://127.0.0.1:8000
echo   - Interactive API Doc: http://127.0.0.1:8000/docs
echo   - Model Health Status: http://127.0.0.1:8000/api/health
echo ========================================================
echo.
pause
