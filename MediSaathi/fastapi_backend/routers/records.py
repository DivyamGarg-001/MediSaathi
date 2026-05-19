"""Health record AI endpoints: structured analysis on upload + per-record chat."""

from fastapi import APIRouter

from fastapi_backend.models.record import AnalyzeRecordRequest, ChatRecordRequest
from fastapi_backend.services.record_analysis import analyze_record, chat_with_record

router = APIRouter(prefix="/api/records", tags=["records-ai"])


@router.post("/analyze")
async def api_analyze_record(req: AnalyzeRecordRequest):
    """Extract text from a PDF record, generate AI summary/tags/critical-findings, update DB."""
    return await analyze_record(req.record_id)


@router.post("/chat")
async def api_chat_record(req: ChatRecordRequest):
    """Answer a patient's question about one specific health record using its extracted text."""
    history = [m.model_dump() for m in req.history] if req.history else None
    return await chat_with_record(req.record_id, req.question, history)
