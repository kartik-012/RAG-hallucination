# RAG Hallucination Auditor

> A diagnostic tool that verifies AI-generated answers **sentence by sentence** against source documents — using a local NLI model, never asking the same LLM to judge itself.

---

## What It Does

Paste a question. The app:
1. **Retrieves** the most relevant document chunks using semantic similarity (ChromaDB + Sentence Transformers)
2. **Generates** an answer using Google Gemini, grounded in only those chunks
3. **Verifies** every sentence in the answer using a local NLI cross-encoder model
4. **Displays** each claim color-coded: 🟢 Supported · 🟡 Unverifiable · 🔴 Contradicted
5. **Shows evidence**: click any sentence → see exactly which source passage matched (or didn't)

**Key architectural decision:** verification uses `cross-encoder/nli-deberta-v3-base` running locally — no LLM is ever asked to judge its own output.

---

## Benchmark Numbers

| Metric | Score |
|--------|-------|
| Precision | ≥ 80% (run benchmark to see your actual number) |
| Recall | ≥ 70% |
| Items | 35 curated Q&A pairs with injected hallucinations |

Run `▶ Run Full Benchmark` in the dashboard to get your actual numbers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + Recharts |
| Backend | FastAPI (async) + Python 3.10+ |
| Embeddings | `all-MiniLM-L6-v2` (Sentence Transformers, CPU) |
| Vector Store | ChromaDB (local, file-based) |
| NLI / Verification | `cross-encoder/nli-deberta-v3-base` (local, CPU) |
| Generation | Google Gemini 1.5 Flash |
| Database | SQLite (aiosqlite) |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### Quick Start

**Mac / Linux:**
```bash
git clone <your-repo>
cd rag-hallucination-auditor
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bat
setup.bat
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Add your Gemini API key
cp .env.example .env
# Edit .env → GEMINI_API_KEY=your_key_here

# Seed the document database (15 AI/ML documents)
python -m app.db.seed

# Start the server
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
rag-hallucination-auditor/
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   ├── query.py          # POST /query, GET /query/{id}, POST /query/{id}/compare
│       │   ├── benchmark.py      # POST /benchmark/run, GET /benchmark/results
│       │   ├── documents.py      # GET/POST /documents
│       │   └── misc.py           # GET /health, /settings, /history
│       ├── core/
│       │   └── config.py         # All configuration constants
│       ├── db/
│       │   ├── database.py       # Async SQLite helpers
│       │   ├── schema.py         # Full SQL schema + init
│       │   └── seed.py           # Seeds 15 knowledge-base documents
│       ├── models/
│       │   └── schemas.py        # All Pydantic models
│       └── services/
│           ├── vector_store.py   # ChromaDB wrapper
│           ├── ingestion.py      # Document chunking + embedding
│           ├── claim_extractor.py# Sentence splitting
│           ├── verifier.py       # NLI cross-encoder verification ← CORE
│           ├── generation.py     # Gemini answer generation
│           ├── pipeline.py       # Full orchestration pipeline
│           └── benchmark.py      # 35-item benchmark runner
│
└── frontend/
    ├── index.html
    ├── vite.config.js            # Proxy config → backend
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Router
        ├── main.jsx
        ├── lib/
        │   ├── api.js            # All API calls
        │   └── verdict.js        # Color tokens + helpers
        ├── styles/globals.css
        ├── components/
        │   ├── ui/index.jsx      # Card, Button, Badge, Spinner, Toast, etc.
        │   ├── claims/
        │   │   ├── ClaimChip.jsx # ← Centerpiece component (colored underline + evidence thread)
        │   │   └── EvidenceModal.jsx
        │   ├── benchmark/
        │   │   └── Charts.jsx    # Recharts: trend, category breakdown, confusion matrix
        │   └── layout/Navbar.jsx
        └── pages/
            ├── HomePage.jsx      # Ask a question
            ├── ResultPage.jsx    # Verification result (claim chips)
            ├── CompareView.jsx   # Side-by-side model comparison
            ├── BenchmarkPage.jsx # Dashboard with metrics + charts
            ├── HistoryPage.jsx   # Past queries
            ├── DocumentsPage.jsx # Document library + trust weighting
            └── SettingsPage.jsx  # Strictness slider
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/query` | Run retrieval → generation → verification |
| GET | `/query/{id}` | Fetch a stored result |
| POST | `/query/{id}/compare` | Compare a second model on same question |
| POST | `/benchmark/run` | Run full 35-item benchmark |
| GET | `/benchmark/results` | List all benchmark batches |
| GET | `/benchmark/results/{id}` | Full batch detail with precision/recall |
| GET | `/documents` | List ingested documents |
| POST | `/documents` | Ingest a new document |
| PATCH | `/documents/{id}/trust` | Update trust weight |
| GET | `/settings` | Get current settings |
| PATCH | `/settings` | Update strictness threshold |
| GET | `/history` | Past 50 queries |
| GET | `/health` | Health check |

---

## How Verification Works (Technical)

```
Question
  → ChromaDB similarity search → top-5 chunks
  → Gemini generates answer (grounded prompt: "use ONLY this context")
  → Regex sentence splitter → N claims
  → For each claim:
      cross-encoder/nli-deberta-v3-base.predict([(chunk_text, claim), ...])
      → [contradiction_prob, entailment_prob, neutral_prob]
      → apply trust_weight multiplier
      → if entail_prob >= threshold → "supported"
      → if contra_prob >= threshold → "contradicted"
      → else → "unverifiable"
  → Store all results in SQLite
  → Return full nested JSON to frontend
```

---

## Design Decisions

- **No 3D** — unlike a debate app where 3D maps to a physical space, text verification has no natural spatial metaphor. The 2D claim/evidence interaction (colored underline → click → source) IS the visual centerpiece.
- **Verdict colors reserved** — green/yellow/red never appear on buttons, nav items, or unrelated charts. Only on verdict chips and the confusion matrix.
- **Serif for claim text** — differentiates "the thing being judged" from "the UI doing the judging."
- **No auth** — single-operator demo tool, not multi-tenant SaaS.
- **NLI over LLM** — the single most important decision: verification is independent of generation.

---

## Resume Bullet (fill in your actual numbers after running benchmark)

> Built a RAG Hallucination Auditor achieving **__% precision / __% recall** on 35 annotated Q&A pairs; performs sentence-level NLI verification using a local cross-encoder model fully independent of the generation LLM.
