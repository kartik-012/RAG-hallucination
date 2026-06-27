#!/bin/bash
# setup.sh — Run this once to set up the full project
set -e

echo ""
echo "========================================"
echo "  RAG Hallucination Auditor — Setup"
echo "========================================"
echo ""

# ── Backend ──────────────────────────────────────────────────────────────────
echo "[1/5] Creating Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

echo "[2/5] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "[3/5] Setting up environment variables..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "  ⚠  Created backend/.env from template."
  echo "  ✎  Open backend/.env and add your GEMINI_API_KEY before running the app."
  echo ""
else
  echo "  ✓  backend/.env already exists."
fi

echo "[4/5] Seeding the database with 15 documents..."
python -m app.db.seed
deactivate
cd ..

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "[5/5] Installing frontend dependencies..."
cd frontend
npm install -q
cd ..

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Add your Gemini API key to backend/.env"
echo "     GEMINI_API_KEY=your_key_here"
echo ""
echo "  2. Start the backend (in one terminal):"
echo "     cd backend"
echo "     source venv/bin/activate"
echo "     uvicorn main:app --reload"
echo ""
echo "  3. Start the frontend (in another terminal):"
echo "     cd frontend"
echo "     npm run dev"
echo ""
echo "  4. Open http://localhost:5173 in your browser"
echo ""
