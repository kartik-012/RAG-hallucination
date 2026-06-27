import uuid
import json
from datetime import datetime
from app.db.database import execute_query, fetch_all, fetch_one
from app.services.pipeline import run_pipeline

# 35 benchmark items: mix of clean and hallucination-injected Q&A pairs
BENCHMARK_ITEMS = [
    # Category: AI/ML Fundamentals
    {"question": "What is retrieval-augmented generation?", "expected": "RAG combines retrieval of relevant documents with language model generation.", "hallucinated": False, "category": "AI Basics"},
    {"question": "What is the difference between supervised and unsupervised learning?", "expected": "Supervised learning uses labeled data; unsupervised finds patterns in unlabeled data.", "hallucinated": False, "category": "AI Basics"},
    {"question": "What are transformer models used for?", "expected": "Transformers are used for NLP tasks like translation, summarization, and question answering.", "hallucinated": False, "category": "AI Basics"},
    {"question": "What is a hallucination in AI?", "expected": "An AI hallucination is when a model generates confident but factually incorrect information.", "hallucinated": False, "category": "AI Basics"},
    {"question": "What is the attention mechanism in neural networks?", "expected": "Attention allows models to weigh which parts of input are most relevant when generating each output token.", "hallucinated": False, "category": "AI Basics"},

    # Category: RAG Systems
    {"question": "What is a vector database?", "expected": "A vector database stores embeddings and enables similarity search.", "hallucinated": False, "category": "RAG Systems"},
    {"question": "What is semantic similarity?", "expected": "Semantic similarity measures how close two pieces of text are in meaning.", "hallucinated": False, "category": "RAG Systems"},
    {"question": "What is document chunking?", "expected": "Chunking splits documents into smaller pieces for efficient retrieval.", "halluzinated": False, "category": "RAG Systems"},
    {"question": "What is NLI in natural language processing?", "expected": "NLI (Natural Language Inference) determines if a hypothesis is entailed, contradicted, or neutral given a premise.", "hallucinated": False, "category": "RAG Systems"},
    {"question": "What is a cross-encoder model?", "expected": "A cross-encoder jointly encodes two texts and scores their relationship, unlike bi-encoders.", "hallucinated": False, "category": "RAG Systems"},

    # Category: Python & FastAPI
    {"question": "What is FastAPI used for?", "expected": "FastAPI is a Python web framework for building APIs with automatic docs and async support.", "hallucinated": False, "category": "Backend"},
    {"question": "What is SQLite?", "expected": "SQLite is a lightweight, file-based relational database requiring no server.", "hallucinated": False, "category": "Backend"},
    {"question": "What is ChromaDB?", "expected": "ChromaDB is an open-source vector database for embedding storage and similarity search.", "hallucinated": False, "category": "Backend"},
    {"question": "What does async/await mean in Python?", "expected": "async/await enables non-blocking concurrent code execution using coroutines.", "hallucinated": False, "category": "Backend"},
    {"question": "What is Pydantic used for?", "expected": "Pydantic is used for data validation and settings management using Python type hints.", "hallucinated": False, "category": "Backend"},

    # Category: Frontend / React
    {"question": "What is React?", "expected": "React is a JavaScript library for building user interfaces using components.", "hallucinated": False, "category": "Frontend"},
    {"question": "What is Vite?", "expected": "Vite is a fast frontend build tool using ES modules for development.", "hallucinated": False, "category": "Frontend"},
    {"question": "What is TailwindCSS?", "expected": "TailwindCSS is a utility-first CSS framework for rapid UI development.", "hallucinated": False, "category": "Frontend"},

    # HALLUCINATED ITEMS — detector should flag contradicted or unverifiable
    {"question": "What is retrieval-augmented generation?", "expected": "RAG was invented by Google in 2021 and runs exclusively on TPUs.", "hallucinated": True, "category": "AI Basics"},
    {"question": "What is a vector database?", "expected": "Vector databases cannot store more than 1 million embeddings and require GPU-only environments.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is the attention mechanism?", "expected": "Attention was invented in 1985 and is only used in image classification models.", "hallucinated": True, "category": "AI Basics"},
    {"question": "What is SQLite?", "expected": "SQLite requires a dedicated server process and supports up to 10,000 concurrent writes per second.", "hallucinated": True, "category": "Backend"},
    {"question": "What is FastAPI?", "expected": "FastAPI is built on Django and requires PostgreSQL as its database backend.", "hallucinated": True, "category": "Backend"},
    {"question": "What is ChromaDB?", "expected": "ChromaDB was acquired by Microsoft in 2023 and is only available as a cloud service.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is NLI?", "expected": "NLI stands for Neurological Language Integration and is used exclusively for speech recognition.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is document chunking?", "expected": "Document chunking was invented by OpenAI and requires GPT-4 to process.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is React?", "expected": "React was created by Microsoft in 2015 and is written in TypeScript.", "hallucinated": True, "category": "Frontend"},
    {"question": "What is TailwindCSS?", "expected": "TailwindCSS requires JavaScript to function and was built on top of Bootstrap.", "hallucinated": True, "category": "Frontend"},
    {"question": "What is Pydantic?", "expected": "Pydantic is a JavaScript library for runtime type checking in Node.js applications.", "hallucinated": True, "category": "Backend"},
    {"question": "What is semantic similarity?", "expected": "Semantic similarity uses GPS coordinates to compare documents geographically.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is a cross-encoder?", "expected": "Cross-encoders process each sentence independently without any interaction between them.", "hallucinated": True, "category": "RAG Systems"},
    {"question": "What is a transformer model?", "expected": "Transformers were invented for image recognition and cannot process text data.", "hallucinated": True, "category": "AI Basics"},
    {"question": "What is a hallucination in AI?", "expected": "Hallucination is a feature where AI models deliberately generate creative fictional content on demand.", "hallucinated": True, "category": "AI Basics"},
    {"question": "What does async/await mean in Python?", "expected": "Async/await in Python forces all code to run sequentially on a single CPU thread.", "hallucinated": True, "category": "Backend"},
]


async def seed_benchmark():
    """Insert benchmark items into DB if not already seeded."""
    existing = await fetch_all("SELECT id FROM benchmark_items LIMIT 1")
    if existing:
        return  # already seeded

    now = datetime.utcnow().isoformat()
    for item in BENCHMARK_ITEMS:
        item_id = str(uuid.uuid4())
        await execute_query(
            "INSERT INTO benchmark_items(id, question_text, expected_answer_text, contains_injected_hallucination, category, created_at) VALUES(?,?,?,?,?,?)",
            (item_id, item["question"], item["expected"], 1 if item["hallucinated"] else 0, item["category"], now),
        )


async def run_benchmark(strictness: float = 0.7) -> str:
    """Run all benchmark items through the pipeline. Returns run_batch_id."""
    await seed_benchmark()

    batch_id = str(uuid.uuid4())
    items = await fetch_all("SELECT * FROM benchmark_items ORDER BY category, created_at")

    for item in items:
        # Create query row
        query_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        await execute_query(
            "INSERT INTO queries(id, question_text, strictness_threshold, created_at) VALUES(?,?,?,?)",
            (query_id, item["question_text"], strictness, now),
        )

        gen_id = await run_pipeline(query_id, item["question_text"], strictness, "gemini-1.5-flash")

        # Check if detector is correct
        gen = await fetch_one("SELECT * FROM generations WHERE id=?", (gen_id,))
        claims = await fetch_all("SELECT * FROM claims WHERE generation_id=?", (gen_id,))
        verifs = await fetch_all(
            "SELECT v.verdict FROM verifications v JOIN claims c ON v.claim_id=c.id WHERE c.generation_id=?",
            (gen_id,),
        )

        any_contradicted = any(v["verdict"] == "contradicted" for v in verifs)
        any_unsupported = any(v["verdict"] in ("unverifiable", "contradicted") for v in verifs)

        expected_has_hallucination = bool(item["contains_injected_hallucination"])
        detector_flagged = any_contradicted or (expected_has_hallucination and any_unsupported)

        detector_correct = (detector_flagged == expected_has_hallucination)

        run_id = str(uuid.uuid4())
        await execute_query(
            "INSERT INTO benchmark_runs(id, benchmark_item_id, generation_id, run_batch_id, detector_correct, created_at) VALUES(?,?,?,?,?,?)",
            (run_id, item["id"], gen_id, batch_id, 1 if detector_correct else 0, now),
        )

    return batch_id


async def get_benchmark_results(batch_id: str) -> dict:
    runs = await fetch_all(
        """SELECT br.*, bi.question_text, bi.contains_injected_hallucination, bi.category,
           br.generation_id
           FROM benchmark_runs br
           JOIN benchmark_items bi ON br.benchmark_item_id = bi.id
           WHERE br.run_batch_id=? ORDER BY bi.category, bi.created_at""",
        (batch_id,),
    )

    if not runs:
        return None

    total = len(runs)
    correct = sum(1 for r in runs if r["detector_correct"])

    # Precision: TP / (TP + FP)
    # Recall: TP / (TP + FN)
    tp = sum(1 for r in runs if r["detector_correct"] and r["contains_injected_hallucination"])
    fp = sum(1 for r in runs if not r["detector_correct"] and not r["contains_injected_hallucination"])
    fn = sum(1 for r in runs if not r["detector_correct"] and r["contains_injected_hallucination"])

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    accuracy = correct / total if total > 0 else 0.0

    return {
        "run_batch_id": batch_id,
        "total_items": total,
        "correct": correct,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "accuracy": round(accuracy, 4),
        "runs": runs,
        "created_at": runs[0]["created_at"] if runs else "",
    }


async def list_benchmark_batches() -> list:
    return await fetch_all(
        """SELECT run_batch_id, COUNT(*) as total_items,
           SUM(detector_correct) as correct,
           MIN(created_at) as created_at
           FROM benchmark_runs
           GROUP BY run_batch_id ORDER BY created_at DESC"""
    )
