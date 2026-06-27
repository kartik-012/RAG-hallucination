from sentence_transformers import CrossEncoder
from app.core.config import NLI_MODEL

_model = None


def get_model():
    global _model
    if _model is None:
        print(f"Loading NLI model: {NLI_MODEL}")
        _model = CrossEncoder(NLI_MODEL)
    return _model


TRUST_WEIGHT_MAP = {"high": 1.2, "medium": 1.0, "low": 0.8}


def verify_claim(
    claim: str,
    candidate_chunks: list[dict],
    strictness_threshold: float = 0.7,
) -> dict:
    """
    For a single claim, run the NLI cross-encoder against each candidate chunk.
    Returns: verdict, confidence_score, matched_chunk_id, reasoning_text
    """
    model = get_model()

    if not candidate_chunks:
        return {
            "verdict": "unverifiable",
            "confidence_score": 0.0,
            "matched_chunk_id": None,
            "reasoning_text": "No source documents were retrieved for this claim.",
        }

    # Build premise-hypothesis pairs: (chunk_text, claim)
    pairs = [(chunk["chunk_text"], claim) for chunk in candidate_chunks]

    # Cross-encoder scores: [contradiction, entailment, neutral] logits
    # deberta-v3-base outputs: [contradiction, entailment, neutral]
    scores_raw = model.predict(pairs, apply_softmax=True)

    best_score = -1
    best_chunk = None
    best_verdict = "unverifiable"
    best_entail = 0.0
    best_contra = 0.0

    for i, score_vec in enumerate(scores_raw):
        chunk = candidate_chunks[i]
        trust_mult = TRUST_WEIGHT_MAP.get(chunk.get("trust_weight", "medium"), 1.0)

        # score_vec = [contradiction_prob, entailment_prob, neutral_prob]
        contra_prob = float(score_vec[0]) * trust_mult
        entail_prob = float(score_vec[1]) * trust_mult
        neutral_prob = float(score_vec[2])

        # Pick the dominant signal for this chunk
        dominant = max(entail_prob, contra_prob)

        if dominant > best_score:
            best_score = dominant
            best_chunk = chunk
            best_entail = float(score_vec[1])
            best_contra = float(score_vec[0])

    if best_chunk is None:
        return {
            "verdict": "unverifiable",
            "confidence_score": 0.0,
            "matched_chunk_id": None,
            "reasoning_text": "Could not find a relevant source passage for this claim.",
        }

    # Determine verdict based on strictness threshold
    if best_entail >= strictness_threshold:
        verdict = "supported"
        confidence = min(best_entail, 1.0)
        reasoning = f"Claim is directly supported by: \"{best_chunk['chunk_text'][:120]}...\""
    elif best_contra >= strictness_threshold:
        verdict = "contradicted"
        confidence = min(best_contra, 1.0)
        reasoning = f"Claim contradicts the source: \"{best_chunk['chunk_text'][:120]}...\""
    else:
        verdict = "unverifiable"
        confidence = max(best_entail, best_contra)
        reasoning = f"No strong match found. Best candidate: \"{best_chunk['chunk_text'][:120]}...\""

    return {
        "verdict": verdict,
        "confidence_score": round(confidence, 4),
        "matched_chunk_id": best_chunk["chunk_id"],
        "reasoning_text": reasoning,
    }
