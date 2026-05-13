@echo off
REM PulseChat Quick Start Script for Windows
echo.
echo ========================================
echo    PulseChat Development Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo Node version: 
node --version
echo.

REM Create uploads directory if it doesn't exist
if not exist "server\uploads" (
    mkdir "server\uploads"
    echo Created uploads directory
)

REM Install backend dependencies
echo.
echo [1/4] Installing backend dependencies...
cd server
if not exist "node_modules" (
    call npm install
) else (
    echo Dependencies already installed
)
echo.

REM Check for .env file
if not exist ".env" (
    echo.
    echo WARNING: .env file not found in server directory
    echo Please create .env file with:
    echo   - MONGO_URI=mongodb://localhost:27017/pulsechat
    echo   - JWT_SECRET=^(generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"^)
    echo   - NODE_ENV=development
    echo.
    pause
)

REM Start backend server
echo.
echo [2/4] Starting backend server (port 5000)...
echo.
start "PulseChat Server" cmd /k npm run dev

REM Give server time to start
timeout /t 3 /nobreak

REM Install frontend dependencies
echo.
echo [3/4] Installing frontend dependencies...
cd ..\pulsechat-client
if not exist "node_modules" (
    call npm install
) else (
    echo Dependencies already installed
)
echo.

REM Start frontend server
echo.
echo [4/4] Starting frontend server (port 5173)...
echo.
start "PulseChat Client" cmd /k npm run dev

echo.
echo ========================================
echo    Servers Starting
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo Health:   http://localhost:5000/health
echo.
echo Two console windows should open automatically.
echo Press Ctrl+C in each to stop.
echo.
pause
