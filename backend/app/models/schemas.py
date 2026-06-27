from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class TrustWeight(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Verdict(str, Enum):
    supported = "supported"
    unverifiable = "unverifiable"
    contradicted = "contradicted"


class GenerationStatus(str, Enum):
    generating = "generating"
    verifying = "verifying"
    complete = "complete"
    error = "error"


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str
    source_label: str
    trust_weight: TrustWeight = TrustWeight.medium
    full_text: str


class DocumentOut(BaseModel):
    id: str
    title: str
    source_label: str
    trust_weight: str
    created_at: str
    chunk_count: int = 0


class DocumentChunkOut(BaseModel):
    id: str
    document_id: str
    chunk_text: str
    chunk_index: int


# ── Queries ───────────────────────────────────────────────────────────────────

class QueryCreate(BaseModel):
    question_text: str = Field(..., max_length=500)
    strictness_threshold: float = Field(0.7, ge=0.0, le=1.0)
    model_name: str = "gemini-1.5-flash"


# ── Verifications ─────────────────────────────────────────────────────────────

class VerificationOut(BaseModel):
    id: str
    claim_id: str
    verdict: str
    confidence_score: float
    matched_chunk_id: Optional[str]
    reasoning_text: str
    matched_chunk_text: Optional[str] = None
    matched_doc_title: Optional[str] = None


class ClaimOut(BaseModel):
    id: str
    generation_id: str
    claim_text: str
    sentence_index: int
    verification: Optional[VerificationOut] = None


class GenerationOut(BaseModel):
    id: str
    query_id: str
    model_name: str
    answer_text: str
    status: str
    error_message: Optional[str]
    claims: List[ClaimOut] = []
    created_at: str


class QueryOut(BaseModel):
    id: str
    question_text: str
    strictness_threshold: float
    created_at: str
    generations: List[GenerationOut] = []


# ── Benchmark ─────────────────────────────────────────────────────────────────

class BenchmarkItemOut(BaseModel):
    id: str
    question_text: str
    expected_answer_text: str
    contains_injected_hallucination: bool
    category: Optional[str]


class BenchmarkRunOut(BaseModel):
    id: str
    benchmark_item_id: str
    generation_id: str
    run_batch_id: str
    detector_correct: bool
    question_text: str
    contains_injected_hallucination: bool
    category: Optional[str]
    generation: Optional[GenerationOut] = None


class BenchmarkResultsOut(BaseModel):
    run_batch_id: str
    total_items: int
    correct: int
    precision: float
    recall: float
    accuracy: float
    runs: List[BenchmarkRunOut]
    created_at: str


class BenchmarkSummary(BaseModel):
    run_batch_id: str
    total_items: int
    correct: int
    precision: float
    recall: float
    accuracy: float
    created_at: str


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingsOut(BaseModel):
    default_strictness_threshold: float
    updated_at: str


class SettingsUpdate(BaseModel):
    default_strictness_threshold: float = Field(..., ge=0.0, le=1.0)


# ── Compare ───────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    model_config = {'protected_namespaces': ()}
    model_name: str
    strictness_threshold: Optional[float] = None
