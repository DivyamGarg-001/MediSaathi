from pydantic import BaseModel


class HospitalInsightsRequest(BaseModel):
    user_id: str  # hospital's user_id
