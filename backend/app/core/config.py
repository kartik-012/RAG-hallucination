import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
EMBED_MODEL = "all-MiniLM-L6-v2"
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"
CHROMA_DIR = "./chroma_db"
SQLITE_DB = "./rag_auditor.db"
TOP_K_CHUNKS = 5
DEFAULT_STRICTNESS = 0.7
