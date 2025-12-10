@echo off
echo Starting development servers...

start "FastAPI Backend" cmd /k "call .venv\Scripts\activate && cd backend && uvicorn app.main:app --reload"

start "Next.js Frontend" cmd /k "cd qa-app && npm run dev"

echo Servers started in separate windows.
