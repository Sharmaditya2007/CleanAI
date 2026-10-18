@echo off
title Clean AI - Backend Server
echo ========================================================
echo       CLEAN AI - SMART CIVIC SANITATION PLATFORM
echo               Starting Backend Server
echo ========================================================
echo.

cd /d "%~dp0backend"
echo [1/3] Checking Python runtime...
python --version
if errorlevel 1 (
    echo [ERROR] Python not found in PATH!
    pause
    exit /b 1
)

echo [2/3] Verifying Clean AI Model Weights...
python -c "from config import settings; print('Model Target Path:', settings.MODEL_PATH)"

echo [3/3] Starting FastAPI Uvicorn Server on http://127.0.0.1:8000 ...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
