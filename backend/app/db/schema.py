import sqlite3
from app.core.config import SQLITE_DB

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_label TEXT NOT NULL,
    trust_weight TEXT NOT NULL DEFAULT 'medium' CHECK(trust_weight IN ('high','medium','low')),
    full_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL CHECK(chunk_index >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    question_text TEXT NOT NULL CHECK(length(question_text) <= 500),
    strictness_threshold REAL NOT NULL DEFAULT 0.7 CHECK(strictness_threshold BETWEEN 0.0 AND 1.0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generating' CHECK(status IN ('generating','verifying','complete','error')),
    error_message TEXT,
    retrieved_chunk_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    sentence_index INTEGER NOT NULL CHECK(sentence_index >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(generation_id, sentence_index)
);

CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL UNIQUE REFERENCES claims(id) ON DELETE CASCADE,
    verdict TEXT NOT NULL CHECK(verdict IN ('supported','unverifiable','contradicted')),
    confidence_score REAL NOT NULL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
    matched_chunk_id TEXT REFERENCES document_chunks(id),
    reasoning_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS benchmark_items (
    id TEXT PRIMARY KEY,
    question_text TEXT NOT NULL,
    expected_answer_text TEXT NOT NULL,
    contains_injected_hallucination INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS benchmark_runs (
    id TEXT PRIMARY KEY,
    benchmark_item_id TEXT NOT NULL REFERENCES benchmark_items(id) ON DELETE CASCADE,
    generation_id TEXT NOT NULL REFERENCES generations(id),
    run_batch_id TEXT NOT NULL,
    detector_correct INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    default_strictness_threshold REAL NOT NULL DEFAULT 0.7 CHECK(default_strictness_threshold BETWEEN 0.0 AND 1.0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_query_id ON generations(query_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_claims_generation_id ON claims(generation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_claim_id ON verifications(claim_id);
CREATE INDEX IF NOT EXISTS idx_benchmarkruns_batch_id ON benchmark_runs(run_batch_id);
CREATE INDEX IF NOT EXISTS idx_benchmarkruns_item_id ON benchmark_runs(benchmark_item_id);

INSERT OR IGNORE INTO settings(id, default_strictness_threshold) VALUES(1, 0.7);
"""


def init_db():
    conn = sqlite3.connect(SQLITE_DB)
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()
    print("Database initialized.")
