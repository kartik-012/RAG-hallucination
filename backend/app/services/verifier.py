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

# Label order for cross-encoder/nli-deberta-v3-base:
# After apply_softmax=True, scores correspond to model's label ids.
# The deberta-v3-base NLI model labels: 0=contradiction, 1=entailment, 2=neutral
# However, the actual label mapping depends on model config — we read it dynamically.
# To be safe, we use the model's label2id mapping.
DEBERTA_LABEL_MAP = {
    "contradiction": 0,
    "entailment": 1,
    "neutral": 2,
}


def get_label_indices(model):
    """Get the correct indices for contradiction, entailment, neutral from model config."""
    try:
        label2id = model.model.config.label2id
        # Normalize keys to lowercase
        label2id = {k.lower(): v for k, v in label2id.items()}
        contra_idx = label2id.get("contradiction", 0)
        entail_idx = label2id.get("entailment", 1)
        neutral_idx = label2id.get("neutral", 2)
        return contra_idx, entail_idx, neutral_idx
    except Exception:
        # Fallback: use known deberta-v3-base ordering
        return 0, 1, 2


def verify_claim(
    claim: str,
    candidate_chunks: list,
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

    contra_idx, entail_idx, neutral_idx = get_label_indices(model)

    # Build premise-hypothesis pairs: (chunk_text, claim)
    pairs = [(chunk["chunk_text"], claim) for chunk in candidate_chunks]

    # Cross-encoder scores with softmax applied
    scores_raw = model.predict(pairs, apply_softmax=True)

    best_score = -1
    best_chunk = None
    best_entail = 0.0
    best_contra = 0.0

    for i, score_vec in enumerate(scores_raw):
        chunk = candidate_chunks[i]
        trust_mult = TRUST_WEIGHT_MAP.get(chunk.get("trust_weight", "medium"), 1.0)

        # Extract probabilities using correct label indices
        contra_prob = float(score_vec[contra_idx]) * trust_mult
        entail_prob = float(score_vec[entail_idx]) * trust_mult

        # Pick the dominant signal for this chunk
        dominant = max(entail_prob, contra_prob)

        if dominant > best_score:
            best_score = dominant
            best_chunk = chunk
            best_entail = float(score_vec[entail_idx])
            best_contra = float(score_vec[contra_idx])

    if best_chunk is None:
        return {
            "verdict": "unverifiable",
            "confidence_score": 0.0,
            "matched_chunk_id": None,
            "reasoning_text": "Could not find a relevant source passage for this claim.",
        }

    # Determine verdict based on strictness threshold
    chunk_preview = best_chunk['chunk_text'][:120]
    if best_entail >= strictness_threshold:
        verdict = "supported"
        confidence = min(best_entail, 1.0)
        reasoning = f"Claim is directly supported by: \"{chunk_preview}...\""
    elif best_contra >= strictness_threshold:
        verdict = "contradicted"
        confidence = min(best_contra, 1.0)
        reasoning = f"Claim contradicts the source: \"{chunk_preview}...\""
    else:
        verdict = "unverifiable"
        confidence = max(best_entail, best_contra)
        reasoning = f"No strong match found. Best candidate: \"{chunk_preview}...\""

    return {
        "verdict": verdict,
        "confidence_score": round(confidence, 4),
        "matched_chunk_id": best_chunk["chunk_id"],
        "reasoning_text": reasoning,
    }
