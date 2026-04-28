@echo off
echo =======================================
echo   Starting Dental Treatment Planner...
echo =======================================

echo Starting Flask AI Backend (Port 5000)...
start "AI Backend" cmd /c "python server.py"

echo Starting Node.js API Server (Port 5001)...
start "Node API" cmd /c "cd server && node index.js"

echo Starting React Frontend (Port 5173)...
start "React Frontend" cmd /c "set BROWSER=msedge && npm run dev -- --open"

echo.
echo All servers are starting in separate windows!
echo Feel free to close this window.
pause
