import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryCreate, CompareRequest
from app.db.database import execute_query, fetch_one
from app.services.pipeline import run_pipeline, fetch_full_result

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def create_query(body: QueryCreate):
    query_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    await execute_query(
        "INSERT INTO queries(id, question_text, strictness_threshold, created_at) VALUES(?,?,?,?)",
        (query_id, body.question_text, body.strictness_threshold, now),
    )

    gen_id = await run_pipeline(
        query_id=query_id,
        question=body.question_text,
        strictness_threshold=body.strictness_threshold,
        model_name=body.model_name,
    )

    result = await fetch_full_result(query_id)
    return result


@router.get("/{query_id}")
async def get_query(query_id: str):
    result = await fetch_full_result(query_id)
    if not result:
        raise HTTPException(status_code=404, detail="Query not found")
    return result


@router.post("/{query_id}/compare")
async def compare_models(query_id: str, body: CompareRequest):
    query = await fetch_one("SELECT * FROM queries WHERE id=?", (query_id,))
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    strictness = body.strictness_threshold or query["strictness_threshold"]

    await run_pipeline(
        query_id=query_id,
        question=query["question_text"],
        strictness_threshold=strictness,
        model_name=body.model_name,
    )

    result = await fetch_full_result(query_id)
    return result
