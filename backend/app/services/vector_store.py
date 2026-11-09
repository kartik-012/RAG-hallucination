import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from app.core.config import EMBED_MODEL

STORE_PATH = "./vector_store.json"

_model = None
_chunks = []
_embeddings = []


def get_model():
    global _model
    if _model is None:
        print(f"Loading embedding model: {EMBED_MODEL}")
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def _load_store():
    global _chunks, _embeddings
    if os.path.exists(STORE_PATH):
        try:
            with open(STORE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            _chunks = data.get("chunks", [])
            _embeddings = [np.array(e) for e in data.get("embeddings", [])]
            print(f"Vector store loaded: {len(_chunks)} chunks from disk.")
        except Exception as e:
            print(f"Warning: Could not load vector store: {e}")
            _chunks = []
            _embeddings = []


def _save_store():
    try:
        data = {
            "chunks": _chunks,
            "embeddings": [e.tolist() for e in _embeddings],
        }
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Warning: Could not save vector store: {e}")


_load_store()


def add_chunks(chunk_ids: list, texts: list, metadatas: list):
    global _chunks, _embeddings
    model = get_model()
    new_embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    for i, chunk_id in enumerate(chunk_ids):
        if any(c["chunk_id"] == chunk_id for c in _chunks):
            continue
        _chunks.append({
            "chunk_id": chunk_id,
            "chunk_text": texts[i],
            "document_id": metadatas[i].get("document_id", ""),
            "document_title": metadatas[i].get("document_title", ""),
            "trust_weight": metadatas[i].get("trust_weight", "medium"),
        })
        _embeddings.append(new_embeddings[i])
    _save_store()
    print(f"Added {len(chunk_ids)} chunks. Total: {len(_chunks)}")


def query_chunks(question: str, n_results: int = 5) -> list:
    if not _chunks:
        return []
    model = get_model()
    query_embedding = model.encode([question], convert_to_numpy=True)[0]
    matrix = np.stack(_embeddings)
    query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-10)
    matrix_norms = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10)
    similarities = matrix_norms @ query_norm
    top_indices = np.argsort(similarities)[::-1][:n_results]
    results = []
    for idx in top_indices:
        chunk = _chunks[idx].copy()
        chunk["distance"] = float(1.0 - similarities[idx])
        results.append(chunk)
    return results