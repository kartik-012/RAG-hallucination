"""
Seed the database with a curated set of documents about AI/ML topics.
Run this once after setup: python -m app.db.seed
"""
import asyncio
from app.db.schema import init_db
from app.services.ingestion import ingest_document

DOCUMENTS = [
    {
        "title": "Introduction to RAG Systems",
        "source_label": "Internal Docs",
        "trust_weight": "high",
        "text": """Retrieval-Augmented Generation (RAG) is an AI framework that combines information retrieval with language model generation. In a RAG system, when a user asks a question, the system first retrieves relevant documents from a knowledge base, then passes those documents as context to a language model to generate an answer. RAG was popularized by the Facebook AI Research paper in 2020. It helps reduce hallucinations by grounding the model's responses in retrieved evidence. The key components of a RAG system are: a document store, an embedding model for encoding documents and queries, a vector database for similarity search, and a language model for generation. RAG systems are widely used in enterprise question-answering, chatbots, and AI assistants that need to answer from a specific knowledge base. The retrieval step uses cosine similarity or dot product to find the most semantically similar documents to the user's query.""",
    },
    {
        "title": "Natural Language Inference (NLI) Explained",
        "source_label": "Research Reference",
        "trust_weight": "high",
        "text": """Natural Language Inference (NLI) is a task in natural language processing that determines the logical relationship between two text passages: a premise and a hypothesis. The three possible labels are: entailment (the hypothesis follows from the premise), contradiction (the hypothesis contradicts the premise), and neutral (neither entailment nor contradiction). NLI models are trained on large datasets like SNLI, MultiNLI, and MNLI. Cross-encoder models for NLI take both the premise and hypothesis as input simultaneously, allowing them to model interactions between the texts. The DeBERTa model family (Decoding-enhanced BERT with Disentangled Attention) achieves state-of-the-art results on NLI benchmarks. NLI is the core mechanism used in this RAG Hallucination Auditor to verify whether each claim in an AI-generated answer is supported by, contradicted by, or unverifiable from the source documents.""",
    },
    {
        "title": "Vector Databases and Embeddings",
        "source_label": "Technical Reference",
        "trust_weight": "high",
        "text": """Vector databases store high-dimensional vectors (embeddings) and enable fast similarity search. Embeddings are numerical representations of text, images, or other data where semantically similar items are close together in the vector space. Popular vector databases include ChromaDB, Pinecone, Weaviate, Qdrant, and FAISS. ChromaDB is an open-source, file-based vector database that can run locally without any server setup. It supports cosine similarity, dot product, and L2 distance metrics for search. The all-MiniLM-L6-v2 model from Sentence Transformers is a lightweight, 384-dimensional embedding model that runs efficiently on CPU. Vector databases use approximate nearest neighbor (ANN) algorithms like HNSW (Hierarchical Navigable Small World) for fast retrieval even at large scale. Embeddings enable semantic search where "automobile" and "car" are retrieved together even without exact keyword overlap.""",
    },
    {
        "title": "Transformer Architecture and Attention",
        "source_label": "Research Reference",
        "trust_weight": "high",
        "text": """The Transformer architecture was introduced in the 2017 paper "Attention Is All You Need" by Vaswani et al. at Google. It replaced recurrent neural networks (RNNs) as the dominant architecture for sequence-to-sequence tasks. The key innovation is the self-attention mechanism, which allows each token to attend to all other tokens in the sequence, capturing long-range dependencies efficiently. The Transformer consists of an encoder stack and a decoder stack, each made up of multi-head attention layers and feed-forward networks. Transformers are the foundation for BERT, GPT, T5, and all modern large language models. The attention mechanism computes attention scores using query, key, and value matrices. Multi-head attention runs multiple attention operations in parallel and concatenates the results. Positional encodings are added to token embeddings to preserve sequence order information.""",
    },
    {
        "title": "Hallucination in Language Models",
        "source_label": "Research Reference",
        "trust_weight": "high",
        "text": """Hallucination in AI language models refers to the phenomenon where a model generates confident, fluent text that is factually incorrect or not grounded in any real source. Hallucinations arise because language models are trained to produce statistically plausible text, not necessarily true text. There are two main types: intrinsic hallucinations (contradicting the source material) and extrinsic hallucinations (adding information not present in the source). Hallucination is a significant problem in RAG systems even when documents are provided, as models may blend retrieved information with training knowledge. Common mitigation strategies include: citation-based generation, retrieval-augmented generation, faithfulness-checking via NLI, and self-consistency sampling. The Hallucination Index and GroundedNess scores are metrics used to evaluate how grounded a model's output is. RLHF (Reinforcement Learning from Human Feedback) also reduces but does not eliminate hallucinations.""",
    },
    {
        "title": "FastAPI and Python Backend Development",
        "source_label": "Technical Reference",
        "trust_weight": "medium",
        "text": """FastAPI is a modern, fast Python web framework for building APIs, created by Sebastián Ramírez and first released in 2018. It is built on top of Starlette for the web components and Pydantic for data validation. FastAPI supports asynchronous request handling using Python's async/await syntax, making it suitable for I/O-bound operations. It automatically generates OpenAPI (Swagger) documentation from Python type hints and Pydantic models. FastAPI is one of the fastest Python frameworks available, comparable to NodeJS and Go in benchmark tests. It supports dependency injection, middleware, background tasks, and WebSockets. Uvicorn is the recommended ASGI server for running FastAPI applications. SQLite is a lightweight, serverless, file-based relational database that is built into Python's standard library as the sqlite3 module. It supports full SQL syntax including transactions, indexes, and foreign keys.""",
    },
    {
        "title": "React and Modern Frontend Development",
        "source_label": "Technical Reference",
        "trust_weight": "medium",
        "text": """React is a JavaScript library for building user interfaces, developed and maintained by Meta (formerly Facebook). It was first released in 2013. React uses a component-based architecture where UIs are built from reusable, isolated components. React uses a virtual DOM (Document Object Model) to efficiently update the actual browser DOM. Hooks like useState, useEffect, useContext, and useMemo were introduced in React 16.8 to enable state and side effects in functional components. Vite is a next-generation frontend build tool that uses native ES modules for instant hot module replacement (HMR) during development. TailwindCSS is a utility-first CSS framework that provides low-level utility classes for rapid UI development without writing custom CSS. Recharts is a composable charting library for React built with D3.js, providing line charts, bar charts, area charts, and more.""",
    },
    {
        "title": "ChromaDB Technical Documentation",
        "source_label": "Technical Reference",
        "trust_weight": "high",
        "text": """ChromaDB is an open-source AI-native vector database designed for storing and querying embedding vectors. It was developed by Chroma and is available under the Apache 2.0 license. ChromaDB can run in-process (fully in-memory or persisted to disk) or as a client-server setup. For most development and demo use cases, the PersistentClient mode stores data in a local directory without any server required. ChromaDB supports multiple embedding functions including OpenAI, Cohere, and Sentence Transformers. Collections in ChromaDB hold documents, embeddings, and metadata together. The query method returns the most similar documents to a given query text using the configured distance metric. ChromaDB was not acquired by any major corporation and remains an independent open-source project. It supports up to millions of vectors on commodity hardware.""",
    },
    {
        "title": "Document Chunking Strategies",
        "source_label": "Technical Reference",
        "trust_weight": "medium",
        "text": """Document chunking is the process of splitting large documents into smaller pieces for indexing and retrieval in RAG systems. The choice of chunk size significantly impacts retrieval quality. Common chunking strategies include: fixed-size character chunking (e.g., 300-500 characters), sentence-based chunking, paragraph-based chunking, and recursive character text splitting. Overlap between chunks (e.g., 50 characters) is used to preserve context at chunk boundaries and prevent important information from being split across chunks. Smaller chunks are more precise but may lose context; larger chunks preserve context but may retrieve too much irrelevant content. Chunking does not require any specific language model to process — it is a preprocessing step applied before embedding. The chunk IDs used in the SQLite database match the IDs stored in ChromaDB to link retrieved chunks back to their source documents.""",
    },
    {
        "title": "Evaluation Metrics for NLP",
        "source_label": "Research Reference",
        "trust_weight": "high",
        "text": """Precision and recall are fundamental evaluation metrics in information retrieval and classification tasks. Precision measures the fraction of retrieved items that are relevant: TP / (TP + FP), where TP is true positives and FP is false positives. Recall measures the fraction of relevant items that were retrieved: TP / (TP + FN), where FN is false negatives. Accuracy measures the fraction of all predictions that are correct: (TP + TN) / (TP + TN + FP + FN). The F1 score is the harmonic mean of precision and recall: 2 * (precision * recall) / (precision + recall). A confusion matrix shows TP, TN, FP, FN in a 2x2 grid. In hallucination detection, a true positive is correctly identifying a hallucinated claim; a false positive is incorrectly flagging a grounded claim. High precision means few false alarms; high recall means few missed hallucinations. There is always a trade-off between precision and recall controlled by the confidence threshold.""",
    },
    {
        "title": "Sentence Transformers Library",
        "source_label": "Technical Reference",
        "trust_weight": "high",
        "text": """Sentence Transformers is a Python library for computing dense vector representations of sentences, paragraphs, and images. It is built on top of Hugging Face Transformers and PyTorch. The library provides pre-trained models optimized for semantic similarity, information retrieval, clustering, and NLI tasks. The all-MiniLM-L6-v2 model produces 384-dimensional embeddings and balances speed and quality for most retrieval tasks. Cross-encoder models in Sentence Transformers score pairs of texts directly, making them more accurate but slower than bi-encoders for large-scale retrieval. The cross-encoder/nli-deberta-v3-base model is specifically trained for NLI and outputs three-class probability distributions over contradiction, entailment, and neutral. Cross-encoders are ideal for re-ranking or verification tasks where accuracy matters more than throughput. The library runs fully on CPU, making it suitable for deployment without GPU infrastructure.""",
    },
    {
        "title": "Pydantic Data Validation",
        "source_label": "Technical Reference",
        "trust_weight": "medium",
        "text": """Pydantic is a Python library for data validation and settings management using Python type annotations. It was created by Samuel Colvin and is widely used in FastAPI, SQLModel, and other modern Python frameworks. Pydantic v2 (released in 2023) uses Rust-based validation for significantly better performance than v1. Pydantic models automatically validate and convert input data to the declared Python types. They raise ValidationError exceptions with detailed error messages when validation fails. Pydantic supports field-level validators, model-level validators, and computed fields. BaseModel is the core class for defining schemas; Field() adds metadata like default values, constraints, and descriptions. Pydantic is a Python-specific library with no JavaScript equivalent. It is used exclusively with Python backends and has no built-in support for Node.js or TypeScript.""",
    },
    {
        "title": "Async Programming in Python",
        "source_label": "Technical Reference",
        "trust_weight": "high",
        "text": """Asynchronous programming in Python uses the async/await syntax to write non-blocking, concurrent code. The asyncio module, built into Python's standard library since Python 3.4, provides an event loop that runs coroutines concurrently. A coroutine is defined with async def and is paused at await expressions, allowing other coroutines to run. This enables efficient I/O-bound concurrency (e.g., making multiple HTTP requests simultaneously) without using multiple threads or processes. aiosqlite is an async wrapper around Python's sqlite3 module that allows awaitable database operations. The key insight is that async/await does NOT force code to run sequentially on a single thread — it enables concurrency. Multiple coroutines run interleaved on the event loop, yielding control at await points. For CPU-bound tasks, asyncio provides less benefit than for I/O-bound tasks, where the event loop can run other work while waiting for network or disk I/O.""",
    },
    {
        "title": "Google Gemini API Guide",
        "source_label": "Technical Reference",
        "trust_weight": "medium",
        "text": """Google Gemini is a family of multimodal AI models developed by Google DeepMind. The Gemini API provides programmatic access to Gemini models for text generation, multimodal understanding, and chat applications. The google-generativeai Python SDK is the official client library. Models in the Gemini family include Gemini 1.0 Pro, Gemini 1.5 Flash (fast, efficient), and Gemini 1.5 Pro (higher capability). Gemini 1.5 Flash is recommended for high-throughput applications where speed matters. The API uses an API key for authentication, which should always be stored in environment variables and never hardcoded in source code. The GenerativeModel class is used to initialize a model, and generate_content() produces a text response. Gemini supports structured output, function calling, system instructions, and safety settings. The API is not owned by Microsoft and is not limited to cloud-only access — it can be called from any environment with internet access and a valid API key.""",
    },
    {
        "title": "SQLite Database for Applications",
        "source_label": "Technical Reference",
        "trust_weight": "high",
        "text": """SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine. It is the most widely deployed database engine in the world, built into mobile phones, browsers, and countless applications. SQLite stores the entire database as a single cross-platform file on disk. It requires no separate server process, no configuration, and no administration. Python's standard library includes the sqlite3 module for working with SQLite databases. SQLite supports most of SQL-92: transactions, indexes, triggers, views, and foreign keys. It handles concurrent reads well but serializes concurrent writes — a single writer at a time. For applications with a single user or low write concurrency, SQLite is ideal and requires no migration to Postgres. SQLite files can be inspected with tools like DB Browser for SQLite. There is no requirement for a dedicated server process and no throughput guarantee of 10,000 writes per second — actual performance depends on disk speed and transaction size.""",
    },
]


async def seed():
    init_db()
    print("Seeding documents...")
    for doc in DOCUMENTS:
        doc_id = await ingest_document(
            title=doc["title"],
            source_label=doc["source_label"],
            trust_weight=doc["trust_weight"],
            full_text=doc["text"],
        )
        print(f"  ✓ {doc['title']} ({doc_id[:8]}...)")
    print(f"\nSeeded {len(DOCUMENTS)} documents successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
