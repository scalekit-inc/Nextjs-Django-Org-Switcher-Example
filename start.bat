@echo off
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════════╗
echo ║   Organization Switcher Demo Launcher     ║
echo ╚════════════════════════════════════════════╝
echo.

:: Check if virtual environment exists
if not exist "backend\venv" (
    echo [Setup] Creating virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py migrate
    cd ..
    echo [✓] Backend setup complete
    echo.
)

:: Check if node_modules exists
if not exist "frontend\node_modules" (
    echo [Setup] Installing Node modules...
    cd frontend
    call npm install
    cd ..
    echo [✓] Frontend setup complete
    echo.
)

echo [Starting] Launching servers...
echo.

:: Start Django backend in new window
echo [Backend] Starting Django server on port 8000...
start "Django Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start Next.js frontend in new window
echo [Frontend] Starting Next.js server on port 3000...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ╔════════════════════════════════════════════╗
echo ║          🚀 Servers Running!               ║
echo ╚════════════════════════════════════════════╝
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
