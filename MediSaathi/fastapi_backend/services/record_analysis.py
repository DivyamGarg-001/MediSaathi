"""Health record AI features: text extraction, structured analysis, per-record chat."""

import io
import json
from typing import Any

from fastapi_backend.services.supabase_client import get_supabase
from fastapi_backend.services.llm_client import generate_completion


# ── Storage helpers ───────────────────────────────────────────────────


def _path_from_file_url(file_url: str, bucket: str = "patient_records") -> str | None:
    """Extract the in-bucket path from a Supabase public URL.

    Public URL shape: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{userId}/{filename}
    Returns the substring after `/{bucket}/`.
    """
    marker = f"/{bucket}/"
    idx = file_url.find(marker)
    if idx == -1:
        return None
    return file_url[idx + len(marker):]


def _download_record_file(file_url: str) -> bytes | None:
    """Download a record's file bytes from Supabase Storage. Returns None on failure."""
    path = _path_from_file_url(file_url)
    if not path:
        return None
    try:
        sb = get_supabase()
        return sb.storage.from_("patient_records").download(path)
    except Exception:
        return None


# ── Text extraction ───────────────────────────────────────────────────


def _extract_pdf_text(pdf_bytes: bytes, max_chars: int = 12000) -> str:
    """Extract plain text from a PDF byte string. Truncates to max_chars."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        chunks: list[str] = []
        total = 0
        for page in reader.pages:
            page_text = page.extract_text() or ""
            chunks.append(page_text)
            total += len(page_text)
            if total >= max_chars:
                break
        text = "\n".join(chunks).strip()
        if len(text) > max_chars:
            text = text[:max_chars] + "\n...[truncated]"
        return text
    except Exception:
        return ""


# ── Analyze pipeline ──────────────────────────────────────────────────


ANALYZE_SYSTEM = """You are a medical document analyzer for MediSaathi, a healthcare app.
Read the patient's health record text and extract structured information.

IMPORTANT RULES:
- You are NOT a doctor. Don't diagnose. Use neutral observational language.
- Focus on facts present in the document.
- For critical_findings: list values that are clearly outside normal reference ranges, or anything flagged in the document itself as urgent/abnormal/high/low. Empty list if none.
- Tags should be short (1-3 words), specific, and useful for search (e.g., "HbA1c", "fasting", "Apollo Hospital", "Dr. Sharma", "diabetes panel").

You MUST respond with valid JSON only. No markdown, no explanation, just the JSON object.

Schema:
{
  "summary": "2-3 sentence patient-friendly summary of what this report contains",
  "type_suggestion": "lab_report" | "prescription" | "xray" | "scan" | "consultation" | "other",
  "tags": ["tag1", "tag2", ...] (max 8, lowercase),
  "critical_findings": ["short description of any out-of-range / abnormal values"] (empty array if all normal)
}"""


ANALYZE_USER_TEMPLATE = """Analyze this health record.

TITLE: {title}
USER-SELECTED TYPE: {type}
DATE: {date_recorded}

DOCUMENT TEXT:
{text}

Respond with ONLY valid JSON matching the schema."""


def _parse_analyze_json(raw: str) -> dict | None:
    """Parse LLM JSON response, tolerant of code fences and surrounding prose."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return None
        try:
            obj = json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            return None
    return obj if isinstance(obj, dict) else None


VALID_RECORD_TYPES = {"lab_report", "prescription", "xray", "scan", "consultation", "other"}


async def analyze_record(record_id: str) -> dict:
    """Run AI analysis on a health record and update its DB row.

    Returns a dict with success status, populated fields, and any messages.
    Idempotent: re-running re-analyzes. Respects manually-set fields:
      - ai_summary, tags, is_critical: only set if currently null/empty
      - type: only overwrite if currently 'other'
      - content: always overwrite with newly-extracted text
    """
    sb = get_supabase()

    record_resp = sb.table("health_records").select("*").eq("id", record_id).single().execute()
    record = record_resp.data
    if not record:
        return {"success": False, "error": "Record not found"}

    if not record.get("file_url"):
        return {"success": False, "error": "No file attached"}

    file_type = (record.get("file_type") or "").lower()
    if file_type != "application/pdf":
        return {
            "success": False,
            "error": "AI analysis is currently available for PDF files only",
            "skipped": True,
        }

    pdf_bytes = _download_record_file(record["file_url"])
    if not pdf_bytes:
        return {"success": False, "error": "Could not download file from storage"}

    text = _extract_pdf_text(pdf_bytes)
    if not text or len(text.strip()) < 30:
        return {"success": False, "error": "Could not extract readable text from PDF"}

    user_prompt = ANALYZE_USER_TEMPLATE.format(
        title=record.get("title", "Untitled"),
        type=record.get("type", "other"),
        date_recorded=record.get("date_recorded", "unknown"),
        text=text,
    )

    raw = generate_completion(
        system_prompt=ANALYZE_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=800,
        temperature=0.2,
    )

    parsed = _parse_analyze_json(raw)
    if not parsed:
        return {"success": False, "error": "AI returned an unparseable response"}

    summary = (parsed.get("summary") or "").strip()
    type_suggestion = (parsed.get("type_suggestion") or "").strip().lower()
    tags_raw = parsed.get("tags") or []
    critical_findings = parsed.get("critical_findings") or []

    # Sanitize tags
    tags: list[str] = []
    if isinstance(tags_raw, list):
        for t in tags_raw[:8]:
            if isinstance(t, str) and t.strip():
                tags.append(t.strip().lower())

    # Build update payload — respect manually-set fields
    update: dict[str, Any] = {"content": text}

    # ai_summary: only fill if empty
    if summary and not (record.get("ai_summary") or "").strip():
        update["ai_summary"] = summary

    # tags: only fill if currently empty
    existing_tags = record.get("tags") or []
    if tags and (not isinstance(existing_tags, list) or len(existing_tags) == 0):
        update["tags"] = tags

    # is_critical: only set True (never auto-flip a manually-set True back to False)
    if isinstance(critical_findings, list) and len(critical_findings) > 0 and not record.get("is_critical"):
        update["is_critical"] = True

    # type: only auto-suggest when user picked 'other'
    if record.get("type") == "other" and type_suggestion in VALID_RECORD_TYPES and type_suggestion != "other":
        update["type"] = type_suggestion

    sb.table("health_records").update(update).eq("id", record_id).execute()

    return {
        "success": True,
        "summary": summary,
        "tags": tags,
        "critical_findings": critical_findings if isinstance(critical_findings, list) else [],
        "type_suggestion": type_suggestion,
        "updated_fields": list(update.keys()),
    }


# ── Chat pipeline ─────────────────────────────────────────────────────


CHAT_SYSTEM = """You are a medical assistant for MediSaathi. The patient has shared a single health record and is asking a question about it.

IMPORTANT RULES:
- Answer ONLY using information present in the document text. If the answer isn't in the document, say so clearly ("This report doesn't mention that").
- Don't diagnose conditions or prescribe. Use phrases like "this report shows", "consider asking your doctor".
- Be concise and use plain language.
- If asked about something that requires clinical judgment, defer to the patient's doctor.

Plain prose response. No JSON, no markdown formatting."""


CHAT_USER_TEMPLATE = """DOCUMENT TITLE: {title}
DOCUMENT TYPE: {type}
DOCUMENT DATE: {date_recorded}

DOCUMENT TEXT:
{text}"""


async def chat_with_record(record_id: str, question: str, history: list[dict] | None = None) -> dict:
    """Answer a patient's question about a specific health record using its extracted text."""
    sb = get_supabase()

    record_resp = sb.table("health_records").select(
        "id, title, type, date_recorded, content, file_type, ai_summary"
    ).eq("id", record_id).single().execute()
    record = record_resp.data
    if not record:
        return {"success": False, "error": "Record not found"}

    content = (record.get("content") or "").strip()
    if not content:
        return {
            "success": False,
            "error": "This record has no extracted text yet. Run AI analysis first (PDFs only).",
        }

    if not question or not question.strip():
        return {"success": False, "error": "Question is required"}

    # Build message history. Cap at last 4 turns (8 messages) to control context.
    messages: list[dict] = [
        {"role": "system", "content": CHAT_SYSTEM},
        {
            "role": "user",
            "content": CHAT_USER_TEMPLATE.format(
                title=record.get("title", "Untitled"),
                type=record.get("type", "unknown"),
                date_recorded=record.get("date_recorded", "unknown"),
                text=content,
            ),
        },
        {
            "role": "assistant",
            "content": "I've reviewed the document. What would you like to know?",
        },
    ]

    if history:
        # Filter + truncate to last 4 user/assistant pairs
        valid_turns = [
            m for m in history
            if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content")
        ]
        messages.extend(valid_turns[-8:])

    messages.append({"role": "user", "content": question.strip()})

    from fastapi_backend.services.llm_client import get_groq
    from fastapi_backend.config import GROQ_MODEL

    try:
        client = get_groq()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=400,
            temperature=0.3,
        )
        answer = response.choices[0].message.content or ""
    except Exception as e:
        return {"success": False, "error": f"AI service error: {e}"}

    return {"success": True, "answer": answer.strip()}
