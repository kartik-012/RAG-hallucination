from fastapi import APIRouter
from datetime import datetime
from app.db.database import fetch_one, execute_query, fetch_all
from app.models.schemas import SettingsUpdate

router = APIRouter(tags=["misc"])


@router.get("/settings")
async def get_settings():
    row = await fetch_one("SELECT * FROM settings WHERE id=1")
    return row


@router.patch("/settings")
async def update_settings(body: SettingsUpdate):
    now = datetime.utcnow().isoformat()
    await execute_query(
        "UPDATE settings SET default_strictness_threshold=?, updated_at=? WHERE id=1",
        (body.default_strictness_threshold, now),
    )
    return {"message": "Settings updated", "default_strictness_threshold": body.default_strictness_threshold}


@router.get("/history")
async def get_history():
    rows = await fetch_all(
        """SELECT q.id, q.question_text, q.created_at,
           g.model_name, g.status,
           COUNT(CASE WHEN v.verdict='supported' THEN 1 END) as supported_count,
           COUNT(CASE WHEN v.verdict='contradicted' THEN 1 END) as contradicted_count,
           COUNT(CASE WHEN v.verdict='unverifiable' THEN 1 END) as unverifiable_count
           FROM queries q
           LEFT JOIN generations g ON g.query_id = q.id
           LEFT JOIN claims c ON c.generation_id = g.id
           LEFT JOIN verifications v ON v.claim_id = c.id
           GROUP BY q.id, g.id
           ORDER BY q.created_at DESC
           LIMIT 50"""
    )
    return {"history": rows}


@router.get("/health")
async def health():
    return {"status": "ok", "message": "RAG Hallucination Auditor is running"}
