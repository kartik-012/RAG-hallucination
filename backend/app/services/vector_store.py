import chromadb
from chromadb.utils import embedding_functions
from app.core.config import CHROMA_DIR, EMBED_MODEL

_client = None
_collection = None


def get_chroma():
    global _client, _collection
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBED_MODEL)
        _collection = _client.get_or_create_collection(
            name="document_chunks",
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(chunk_ids: list[str], texts: list[str], metadatas: list[dict]):
    col = get_chroma()
    col.add(ids=chunk_ids, documents=texts, metadatas=metadatas)


def query_chunks(question: str, n_results: int = 5) -> list[dict]:
    col = get_chroma()
    results = col.query(query_texts=[question], n_results=n_results, include=["documents", "metadatas", "distances"])
    chunks = []
    if results and results["ids"] and results["ids"][0]:
        for i, cid in enumerate(results["ids"][0]):
            chunks.append({
                "chunk_id": cid,
                "chunk_text": results["documents"][0][i],
                "document_id": results["metadatas"][0][i].get("document_id", ""),
                "document_title": results["metadatas"][0][i].get("document_title", ""),
                "trust_weight": results["metadatas"][0][i].get("trust_weight", "medium"),
                "distance": results["distances"][0][i],
            })
    return chunks
