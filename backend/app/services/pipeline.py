import uuid
import json
from datetime import datetime
from app.db.database import execute_query, fetch_one, fetch_all
from app.services.vector_store import query_chunks
from app.services.generation import generate_answer
from app.services.claim_extractor import extract_claims
from app.services.verifier import verify_claim
from app.core.config import TOP_K_CHUNKS


async def run_pipeline(
    query_id: str,
    question: str,
    strictness_threshold: float,
    model_name: str,
) -> str:
    """
    Full RAG + verification pipeline.
    Returns the generation_id.
    """
    now = datetime.utcnow().isoformat()
    gen_id = str(uuid.uuid4())

    # Create generation row with status=generating
    await execute_query(
        "INSERT INTO generations(id, query_id, model_name, answer_text, status, retrieved_chunk_ids, created_at) VALUES(?,?,?,?,?,?,?)",
        (gen_id, query_id, model_name, "", "generating", "[]", now),
    )

    try:
        # Step 1: Retrieve relevant chunks
        chunks = query_chunks(question, n_results=TOP_K_CHUNKS)
        chunk_ids_json = json.dumps([c["chunk_id"] for c in chunks])

        # Step 2: Generate answer via Gemini
        answer = generate_answer(question, chunks, model_name)

        await execute_query(
            "UPDATE generations SET answer_text=?, status=?, retrieved_chunk_ids=? WHERE id=?",
            (answer, "verifying", chunk_ids_json, gen_id),
        )

        # Step 3: Extract claims
        claims = extract_claims(answer)

        # Step 4: Verify each claim
        for idx, claim_text in enumerate(claims):
            claim_id = str(uuid.uuid4())
            await execute_query(
                "INSERT OR IGNORE INTO claims(id, generation_id, claim_text, sentence_index, created_at) VALUES(?,?,?,?,?)",
                (claim_id, gen_id, claim_text, idx, now),
            )

            result = verify_claim(claim_text, chunks, strictness_threshold)

            verif_id = str(uuid.uuid4())
            await execute_query(
                "INSERT INTO verifications(id, claim_id, verdict, confidence_score, matched_chunk_id, reasoning_text, created_at) VALUES(?,?,?,?,?,?,?)",
                (
                    verif_id, claim_id,
                    result["verdict"],
                    result["confidence_score"],
                    result["matched_chunk_id"],
                    result["reasoning_text"],
                    now,
                ),
            )

        # Mark complete
        await execute_query(
            "UPDATE generations SET status=? WHERE id=?",
            ("complete", gen_id),
        )

    except Exception as e:
        await execute_query(
            "UPDATE generations SET status=?, error_message=? WHERE id=?",
            ("error", str(e), gen_id),
        )
        raise

    return gen_id


async def fetch_full_result(query_id: str) -> dict:
    """Fetch the full nested result: query → generations → claims → verifications."""
    query = await fetch_one("SELECT * FROM queries WHERE id=?", (query_id,))
    if not query:
        return None

    generations = await fetch_all(
        "SELECT * FROM generations WHERE query_id=? ORDER BY created_at ASC",
        (query_id,),
    )

    result_gens = []
    for gen in generations:
        claims = await fetch_all(
            "SELECT * FROM claims WHERE generation_id=? ORDER BY sentence_index ASC",
            (gen["id"],),
        )
        result_claims = []
        for claim in claims:
            verif = await fetch_one(
                "SELECT v.*, dc.chunk_text as matched_chunk_text, d.title as matched_doc_title "
                "FROM verifications v "
                "LEFT JOIN document_chunks dc ON v.matched_chunk_id = dc.id "
                "LEFT JOIN documents d ON dc.document_id = d.id "
                "WHERE v.claim_id=?",
                (claim["id"],),
            )
            result_claims.append({**claim, "verification": verif})
        result_gens.append({**gen, "claims": result_claims})

    return {**query, "generations": result_gens}
