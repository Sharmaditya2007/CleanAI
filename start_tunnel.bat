@echo off
title Clean AI - Cloud Tunnel (Vercel Integration)
echo ========================================================
echo       CLEAN AI - SMART CIVIC SANITATION PLATFORM
echo          Live HTTPS Cloud Tunnel for Vercel
echo ========================================================
echo.
echo Connecting local backend (port 8000) to public HTTPS tunnel...
echo Share this HTTPS URL with your Vercel deployment!
echo.
npx --yes localtunnel --port 8000
pause
