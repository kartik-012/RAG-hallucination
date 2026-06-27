import uuid
from datetime import datetime
from app.db.database import execute_query
from app.services.vector_store import add_chunks


CHUNK_SIZE = 300  # characters per chunk
CHUNK_OVERLAP = 50


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping character-level chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


async def ingest_document(title: str, source_label: str, trust_weight: str, full_text: str) -> str:
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    await execute_query(
        "INSERT INTO documents(id, title, source_label, trust_weight, full_text, created_at) VALUES(?,?,?,?,?,?)",
        (doc_id, title, source_label, trust_weight, full_text, now),
    )

    chunks = chunk_text(full_text)
    chunk_ids = []
    chunk_texts = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = str(uuid.uuid4())
        await execute_query(
            "INSERT INTO document_chunks(id, document_id, chunk_text, chunk_index, created_at) VALUES(?,?,?,?,?)",
            (chunk_id, doc_id, chunk, i, now),
        )
        chunk_ids.append(chunk_id)
        chunk_texts.append(chunk)
        metadatas.append({
            "document_id": doc_id,
            "document_title": title,
            "trust_weight": trust_weight,
            "chunk_index": i,
        })

    if chunk_ids:
        add_chunks(chunk_ids, chunk_texts, metadatas)

    return doc_id
