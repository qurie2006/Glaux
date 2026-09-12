@echo off
title Glaux AI Recruiter Platform
echo ========================================================
echo        GLAUX - Explainable AI Recruiter Platform
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Glaux Backend Server (FastAPI on port 8000)...
start "Glaux Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\activate (call venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) else (python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload)"

echo [2/3] Starting Glaux Frontend Server (Vite on port 5173)...
start "Glaux Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo ========================================================
echo   Glaux is running!
echo   Frontend: http://localhost:5173/
echo   Backend:  http://localhost:8000/
echo   API Docs: http://localhost:8000/docs
echo ========================================================
echo.
pause
