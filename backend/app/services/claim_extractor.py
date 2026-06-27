import re


def extract_claims(text: str) -> list[str]:
    """
    Split answer text into sentence-level claims.
    Uses regex-based sentence splitting — simple, reliable for v1.
    """
    # Normalize whitespace
    text = text.strip()
    if not text:
        return []

    # Split on sentence-ending punctuation followed by whitespace + capital letter
    # Handles: ". " "! " "? " and also ".\n"
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z\"])', text)

    # Further split on newlines that look like new sentences
    result = []
    for sent in sentences:
        parts = sent.split('\n')
        for part in parts:
            part = part.strip()
            if len(part) > 10:  # filter out very short fragments
                result.append(part)

    return result
