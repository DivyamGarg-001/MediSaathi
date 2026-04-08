from groq import Groq
from fastapi_backend.config import GROQ_API_KEY, GROQ_MODEL

_client: Groq | None = None


def get_groq() -> Groq:
    """Return a singleton Groq client."""
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY must be set")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def generate_completion(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 1024,
    temperature: float = 0.4,
) -> str:
    """Send a chat completion request to Groq and return the response text."""
    client = get_groq()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
