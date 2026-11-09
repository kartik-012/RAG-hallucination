import google.generativeai as genai
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL

genai.configure(api_key=GEMINI_API_KEY)


def generate_answer(question: str, context_chunks: list, model_name: str = GEMINI_MODEL) -> str:
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

FORMAT INSTRUCTIONS:
- Structure your answer professionally and clearly.
- Use bullet points if listing multiple items, steps, or distinct facts.
- Ensure every sentence, including bullet points, ends with proper punctuation (e.g., a period) so it can be verified accurately.

CONTEXT:
{context_text}

QUESTION:
{question}

ANSWER (use only the context above):"""

    effective_model = model_name or GEMINI_MODEL
    print(f"Using model: {effective_model}")
    try:
        model = genai.GenerativeModel(effective_model)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        # Fallback: try with gemini-2.5-flash if the specified model fails
        if effective_model != "gemini-2.5-flash":
            print(f"Model {effective_model} failed ({e}), falling back to gemini-2.5-flash")
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        raise
