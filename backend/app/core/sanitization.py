import bleach

from fastapi import HTTPException

def sanitize_text(text: str) -> str:
    if not text:
        return text
    return bleach.clean(text.strip())

def sanitize_query(query: str | None = None) -> str | None:
    if query:
        # Prevent NoSQL Operator Injection
        if "$" in query or "{" in query:
            raise HTTPException(status_code=400, detail="Invalid characters in query parameter.")
        return sanitize_text(query)
    return None
