from fastapi import APIRouter, HTTPException
from app.db.database import fetch_all, execute_query
from app.models.schemas import DocumentCreate
from app.services.ingestion import ingest_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
async def list_documents():
    docs = await fetch_all(
        """SELECT d.*, COUNT(dc.id) as chunk_count
           FROM documents d
           LEFT JOIN document_chunks dc ON dc.document_id = d.id
           GROUP BY d.id ORDER BY d.created_at DESC"""
    )
    return {"documents": docs}


@router.post("")
async def add_document(body: DocumentCreate):
    doc_id = await ingest_document(
        title=body.title,
        source_label=body.source_label,
        trust_weight=body.trust_weight.value,
        full_text=body.full_text,
    )
    return {"id": doc_id, "message": "Document ingested successfully"}


@router.patch("/{doc_id}/trust")
async def update_trust(doc_id: str, trust_weight: str):
    if trust_weight not in ("high", "medium", "low"):
        raise HTTPException(status_code=400, detail="Invalid trust_weight")
    await execute_query(
        "UPDATE documents SET trust_weight=? WHERE id=?",
        (trust_weight, doc_id),
    )
    return {"message": "Trust weight updated"}
