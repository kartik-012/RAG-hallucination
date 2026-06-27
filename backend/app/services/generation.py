import google.generativeai as genai
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL

genai.configure(api_key=GEMINI_API_KEY)


def generate_answer(question: str, context_chunks: list[dict], model_name: str = GEMINI_MODEL) -> str:
    """
    Generate an answer using Gemini, grounded in the provided context chunks.
    The model is explicitly instructed to answer ONLY from the provided context.
    """
    context_text = "\n\n---\n\n".join(
        f"[Source: {c['document_title']}]\n{c['chunk_text']}"
        for c in context_chunks
    )

    prompt = f"""You are a precise assistant. Answer the question using ONLY the information provided in the context below.
Do not use any knowledge outside of the provided context.
If the context does not contain enough information to answer, say so clearly.

CONTEXT:
{context_text}

QUESTION:
{question}

ANSWER (use only the context above):"""

    model = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    return response.text.strip()
