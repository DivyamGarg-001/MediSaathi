import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Supabase
SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Groq
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# FastAPI
FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", "8000"))
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Insight cache duration (seconds) — skip re-generation if insights are newer
INSIGHT_CACHE_TTL: int = int(os.getenv("INSIGHT_CACHE_TTL", "3600"))  # 1 hour
