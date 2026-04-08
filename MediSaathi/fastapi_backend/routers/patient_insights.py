from fastapi import APIRouter

from fastapi_backend.models.patient import GenerateInsightsRequest, GetInsightsRequest, GenerateFamilyInsightsRequest
from fastapi_backend.models.common import InsightResponse
from fastapi_backend.services.insight_service import (
    generate_patient_insights,
    get_cached_insights,
    generate_family_member_insights,
    get_cached_family_insights,
)

router = APIRouter(prefix="/api/patient", tags=["patient-insights"])


@router.post("/insights/generate", response_model=InsightResponse)
async def generate_insights(req: GenerateInsightsRequest):
    """Generate fresh AI health insights for a patient."""
    return await generate_patient_insights(req.user_id)


@router.get("/insights", response_model=InsightResponse)
async def get_insights(user_id: str):
    """Get cached insights if available, otherwise return empty."""
    cached = await get_cached_insights(user_id)
    if cached:
        return cached
    return InsightResponse(success=True, insights=[], cached=False)


@router.post("/insights/family/generate", response_model=InsightResponse)
async def generate_family_insights(req: GenerateFamilyInsightsRequest):
    """Generate fresh AI health insights for a patient's family member."""
    return await generate_family_member_insights(req.user_id, req.family_member_id)


@router.get("/insights/family", response_model=InsightResponse)
async def get_family_insights(user_id: str, family_member_id: str):
    """Get cached insights for a family member."""
    cached = await get_cached_family_insights(user_id, family_member_id)
    if cached:
        return cached
    return InsightResponse(success=True, insights=[], cached=False)
