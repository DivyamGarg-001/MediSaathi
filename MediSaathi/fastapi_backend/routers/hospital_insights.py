"""Hospital AI endpoints: operational insights."""

from fastapi import APIRouter, Query

from fastapi_backend.models.hospital import HospitalInsightsRequest
from fastapi_backend.services.hospital_insight_service import (
    generate_hospital_insights,
    get_cached_hospital_insights,
)

router = APIRouter(prefix="/api/hospital", tags=["hospital-ai"])


@router.post("/insights/generate")
async def api_generate_hospital_insights(req: HospitalInsightsRequest):
    """Generate AI operational insights for a hospital."""
    return await generate_hospital_insights(req.user_id)


@router.get("/insights")
async def api_get_hospital_insights(user_id: str = Query(...)):
    """Get cached hospital insights."""
    cached = await get_cached_hospital_insights(user_id)
    if cached:
        return cached
    return {"success": False, "insights": [], "error": "No cached insights. Click Generate to create new insights."}
