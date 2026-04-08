from pydantic import BaseModel


class PatientSummaryRequest(BaseModel):
    doctor_id: str  # doctors.id (NOT user_id)
    patient_id: str  # patient's user_id


class DoctorInsightsRequest(BaseModel):
    user_id: str  # doctor's user_id


class KeyObservation(BaseModel):
    area: str
    observation: str
    priority: str


class PatientSummaryResponse(BaseModel):
    success: bool
    summary: str = ""
    risk_factors: list[str] = []
    key_observations: list[KeyObservation] = []
    medication_notes: str = ""
    suggested_questions: list[str] = []
    follow_up_recommendations: list[str] = []
    cached: bool = False
    generated_at: str | None = None
    error: str | None = None
