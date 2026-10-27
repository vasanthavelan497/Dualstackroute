# DualStackRoute One-Click Startup Script (PowerShell)
$rootDir = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting DualStackRoute Platform (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend Server
Write-Host "`n[1/2] Launching Backend on http://127.0.0.1:8000 (API Docs: /docs)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; `$env:PYTHONPATH='.'; Write-Host '--- DualStackRoute Backend (FastAPI) ---' -ForegroundColor Cyan; .\backend\venv\Scripts\uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

# 2. Start Vite React Frontend
Write-Host "[2/2] Launching Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; Write-Host '--- DualStackRoute Frontend (Vite + React) ---' -ForegroundColor Green; npm run dev"

Write-Host "`nBoth services are starting in dedicated terminal windows!" -ForegroundColor Green
Write-Host "Frontend URL:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend API:   http://127.0.0.1:8000/docs`n" -ForegroundColor White
