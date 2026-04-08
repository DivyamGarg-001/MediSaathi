"""Doctor AI endpoints: patient summary + practice insights."""

from fastapi import APIRouter, Query

from fastapi_backend.models.doctor import PatientSummaryRequest, DoctorInsightsRequest
from fastapi_backend.services.doctor_insight_service import (
    generate_patient_summary,
    generate_practice_insights,
    get_cached_practice_insights,
)

router = APIRouter(prefix="/api/doctor", tags=["doctor-ai"])


@router.post("/patient-summary/generate")
async def api_generate_patient_summary(req: PatientSummaryRequest):
    """Generate AI patient briefing for a doctor before consultation."""
    return await generate_patient_summary(req.doctor_id, req.patient_id)


@router.post("/insights/generate")
async def api_generate_practice_insights(req: DoctorInsightsRequest):
    """Generate AI practice performance insights for a doctor."""
    return await generate_practice_insights(req.user_id)


@router.get("/insights")
async def api_get_practice_insights(user_id: str = Query(...)):
    """Get cached practice insights for a doctor."""
    cached = await get_cached_practice_insights(user_id)
    if cached:
        return cached
    return {"success": False, "insights": [], "error": "No cached insights. Click Generate to create new insights."}
