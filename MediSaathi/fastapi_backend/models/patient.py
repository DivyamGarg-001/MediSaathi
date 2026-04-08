from pydantic import BaseModel


class GenerateInsightsRequest(BaseModel):
    user_id: str


class GetInsightsRequest(BaseModel):
    user_id: str


class GenerateFamilyInsightsRequest(BaseModel):
    user_id: str
    family_member_id: str
