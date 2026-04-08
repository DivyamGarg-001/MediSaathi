from pydantic import BaseModel
from enum import Enum


class InsightType(str, Enum):
    RISK_PREDICTION = "risk_prediction"
    HEALTH_TREND = "health_trend"
    MEDICATION_REMINDER = "medication_reminder"
    CHECKUP_DUE = "checkup_due"
    # Doctor practice insight types
    PATIENT_FLOW = "patient_flow"
    SCHEDULING = "scheduling"
    CLINICAL_PATTERN = "clinical_pattern"
    EFFICIENCY = "efficiency"
    GROWTH = "growth"
    # Hospital insight types
    BED_UTILIZATION = "bed_utilization"
    DEPARTMENT_PERFORMANCE = "department_performance"
    DOCTOR_WORKLOAD = "doctor_workload"
    APPOINTMENT_EFFICIENCY = "appointment_efficiency"
    REVENUE_TREND = "revenue_trend"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Insight(BaseModel):
    type: InsightType
    title: str
    description: str
    severity: Severity
    recommendation: str


class InsightResponse(BaseModel):
    success: bool
    insights: list[Insight] = []
    cached: bool = False
    generated_at: str | None = None
    error: str | None = None
