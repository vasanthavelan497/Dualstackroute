@echo off
title DualStackRoute Launcher
echo ==========================================================
echo  Starting DualStackRoute Platform (Backend + Frontend)
echo ==========================================================
echo.
echo [1/2] Launching Backend on http://127.0.0.1:8000 ...
start "DualStackRoute Backend" powershell -NoExit -Command "cd '%~dp0'; $env:PYTHONPATH='.'; Write-Host '--- DualStackRoute Backend (FastAPI) ---' -ForegroundColor Cyan; .\backend\venv\Scripts\uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend on http://localhost:5173 ...
start "DualStackRoute Frontend" powershell -NoExit -Command "cd '%~dp0frontend'; Write-Host '--- DualStackRoute Frontend (Vite + React) ---' -ForegroundColor Green; npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo.
pause
