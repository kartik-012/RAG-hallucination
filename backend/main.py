from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.schema import init_db
from app.api import query, benchmark, documents, misc

app = FastAPI(
    title="RAG Hallucination Auditor",
    description="Verify AI-generated answers claim by claim using NLI-based verification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router)
app.include_router(benchmark.router)
app.include_router(documents.router)
app.include_router(misc.router)


@app.on_event("startup")
async def startup():
    init_db()
    print("RAG Hallucination Auditor backend started.")
