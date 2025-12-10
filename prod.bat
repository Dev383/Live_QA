@echo off
echo Starting production servers...

REM
start "FastAPI Backend" cmd /k "call .venv\Scripts\activate && cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM 
start "Next.js Frontend" cmd /k "cd qa-app && npm install --production && npm run build && npm start"

echo Production servers started in separate windows.
