from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.schema import init_db
from app.api import query, benchmark, documents, misc


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("RAG Hallucination Auditor backend started.")
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title="RAG Hallucination Auditor",
    description="Verify AI-generated answers claim by claim using NLI-based verification.",
    version="1.0.0",
    lifespan=lifespan,
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
