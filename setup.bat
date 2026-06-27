@echo off
REM setup.bat — Run this once on Windows to set up the full project

echo.
echo ========================================
echo   RAG Hallucination Auditor — Setup
echo ========================================
echo.

REM Backend
echo [1/5] Creating Python virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat

echo [2/5] Installing Python dependencies...
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo [3/5] Setting up environment variables...
if not exist .env (
  copy .env.example .env
  echo   Created backend\.env from template.
  echo   Open backend\.env and add your GEMINI_API_KEY before running.
) else (
  echo   backend\.env already exists.
)

echo [4/5] Seeding the database...
python -m app.db.seed
call venv\Scripts\deactivate.bat
cd ..

REM Frontend
echo [5/5] Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo ========================================
echo   Setup complete!
echo ========================================
echo.
echo Next steps:
echo   1. Add GEMINI_API_KEY to backend\.env
echo   2. Backend:  cd backend ^& venv\Scripts\activate ^& uvicorn main:app --reload
echo   3. Frontend: cd frontend ^& npm run dev
echo   4. Open http://localhost:5173
echo.
pause
