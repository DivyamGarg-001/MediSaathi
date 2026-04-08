"""Orchestrates doctor AI features: patient summaries and practice insights."""

import json
from datetime import datetime, timedelta, timezone

from fastapi_backend.config import INSIGHT_CACHE_TTL
from fastapi_backend.models.common import Insight, InsightType, Severity, InsightResponse
from fastapi_backend.models.doctor import KeyObservation, PatientSummaryResponse
from fastapi_backend.services.data_aggregator import get_doctor_data, get_doctor_patient_data
from fastapi_backend.services.llm_client import generate_completion
from fastapi_backend.services.supabase_client import get_supabase
from fastapi_backend.utils.prompt_templates import (
    DOCTOR_PATIENT_SUMMARY_SYSTEM,
    DOCTOR_PATIENT_SUMMARY_USER,
    DOCTOR_PRACTICE_SYSTEM,
    DOCTOR_PRACTICE_USER,
)


# ── Patient Summary AI ──────────────────────────────────────────────


def _format_patient_summary_prompt(data: dict) -> str:
    """Build user prompt from aggregated patient data for doctor briefing."""
    patient = data.get("patient", {})
    age = ""
    if patient.get("date_of_birth"):
        try:
            born = datetime.strptime(patient["date_of_birth"], "%Y-%m-%d")
            age = f", Age: {(datetime.utcnow() - born).days // 365}"
        except ValueError:
            pass
    patient_profile = f"Name: {patient.get('full_name', 'Unknown')}{age}, Gender: {patient.get('gender', 'Not specified')}"

    vitals = data.get("vitals", [])
    vitals_text = "No recent vitals." if not vitals else "\n".join(
        f"- {v.get('type', '?')}: {v.get('value', '?')} {v.get('unit', '')} ({v.get('recorded_at', '?')[:10]})"
        + (f" — Note: {v['notes']}" if v.get("notes") else "")
        for v in vitals
    )

    doc_appts = data.get("doctor_appointments", [])
    if not doc_appts:
        doc_appt_text = "No previous appointments with you."
    else:
        lines = []
        for a in doc_appts:
            duration = ""
            if a.get("actual_start_time") and a.get("actual_end_time"):
                try:
                    s = datetime.fromisoformat(a["actual_start_time"])
                    e = datetime.fromisoformat(a["actual_end_time"])
                    duration = f", duration: {int((e - s).total_seconds() / 60)} min"
                except (ValueError, TypeError):
                    pass
            lines.append(
                f"- {a.get('appointment_date', '?')}: {a.get('type', '?')} — {a.get('status', '?')}{duration}"
                + (f" | Notes: {a['notes']}" if a.get("notes") else "")
                + (f" | Reason: {a['reason']}" if a.get("reason") else "")
            )
        doc_appt_text = "\n".join(lines)

    other_appts = data.get("other_appointments", [])
    if not other_appts:
        other_appt_text = "No visits to other doctors recently."
    else:
        lines = []
        for a in other_appts:
            doc = a.get("doctors", {})
            doc_name = doc.get("users", {}).get("full_name", "Unknown") if isinstance(doc, dict) else "Unknown"
            specialty = doc.get("specialty", "") if isinstance(doc, dict) else ""
            lines.append(f"- {a.get('appointment_date', '?')}: {a.get('type', '?')} with Dr. {doc_name} ({specialty}) — {a.get('status', '?')}")
        other_appt_text = "\n".join(lines)

    doc_rx = data.get("doctor_prescriptions", [])
    if not doc_rx:
        doc_rx_text = "No prescriptions from you."
    else:
        lines = []
        for p in doc_rx:
            meds = p.get("medications", [])
            if isinstance(meds, list) and meds:
                med_str = ", ".join(f"{m.get('name', '?')} {m.get('dosage', '')}" for m in meds if isinstance(m, dict))
            else:
                med_str = "Unknown"
            lines.append(f"- {med_str} (until {p.get('valid_until', '?')}, status: {p.get('status', '?')})")
        doc_rx_text = "\n".join(lines)

    all_rx = data.get("all_active_prescriptions", [])
    if not all_rx:
        all_rx_text = "No active prescriptions from any doctor."
    else:
        lines = []
        for p in all_rx:
            doc = p.get("doctors", {})
            doc_name = doc.get("users", {}).get("full_name", "Unknown") if isinstance(doc, dict) else "Unknown"
            meds = p.get("medications", [])
            if isinstance(meds, list) and meds:
                med_str = ", ".join(f"{m.get('name', '?')} {m.get('dosage', '')} ({m.get('frequency', '')})" for m in meds if isinstance(m, dict))
            else:
                med_str = "Unknown"
            lines.append(f"- {med_str} by Dr. {doc_name} (until {p.get('valid_until', '?')})")
        all_rx_text = "\n".join(lines)

    records = data.get("health_records", [])
    if not records:
        records_text = "No health records."
    else:
        lines = []
        for r in records:
            critical = " [CRITICAL]" if r.get("is_critical") else ""
            summary = f" — AI summary: {r['ai_summary']}" if r.get("ai_summary") else ""
            lines.append(f"- {r.get('date_recorded', '?')}: {r.get('title', '?')} ({r.get('type', '?')}){critical}{summary}")
        records_text = "\n".join(lines)

    return DOCTOR_PATIENT_SUMMARY_USER.format(
        patient_profile=patient_profile,
        vitals=vitals_text,
        doctor_appointments=doc_appt_text,
        other_appointments=other_appt_text,
        doctor_prescriptions=doc_rx_text,
        all_active_prescriptions=all_rx_text,
        health_records=records_text,
    )


def _parse_patient_summary(raw: str) -> dict | None:
    """Parse LLM JSON response into patient summary dict."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                result = json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                return None
        else:
            return None

    if not isinstance(result, dict):
        return None
    return result


async def generate_patient_summary(doctor_id: str, patient_id: str) -> PatientSummaryResponse:
    """Generate AI patient briefing for a doctor."""
    try:
        data = await get_doctor_patient_data(doctor_id, patient_id)

        user_prompt = _format_patient_summary_prompt(data)

        raw = generate_completion(
            system_prompt=DOCTOR_PATIENT_SUMMARY_SYSTEM,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.3,
        )

        parsed = _parse_patient_summary(raw)
        if not parsed:
            return PatientSummaryResponse(
                success=False,
                error="Could not generate patient summary. Try again.",
            )

        observations = []
        for obs in parsed.get("key_observations", []):
            if isinstance(obs, dict):
                observations.append(KeyObservation(
                    area=obs.get("area", "general"),
                    observation=obs.get("observation", ""),
                    priority=obs.get("priority", "low"),
                ))

        now = datetime.now(timezone.utc).isoformat()
        return PatientSummaryResponse(
            success=True,
            summary=parsed.get("summary", ""),
            risk_factors=parsed.get("risk_factors", []),
            key_observations=observations,
            medication_notes=parsed.get("medication_notes", ""),
            suggested_questions=parsed.get("suggested_questions", []),
            follow_up_recommendations=parsed.get("follow_up_recommendations", []),
            cached=False,
            generated_at=now,
        )

    except Exception as e:
        return PatientSummaryResponse(success=False, error=str(e))


# ── Practice Insights AI ────────────────────────────────────────────


def _format_practice_prompt(data: dict) -> str:
    """Build user prompt from doctor's practice data."""
    doctor = data.get("doctor", {})
    user_info = doctor.get("users", {})
    doc_name = user_info.get("full_name", "Unknown") if isinstance(user_info, dict) else "Unknown"
    doctor_profile = f"Dr. {doc_name}, Specialty: {doctor.get('specialty', 'Not specified')}"

    appointments = data.get("appointments", [])
    if not appointments:
        appt_text = "No appointments in the last 90 days."
    else:
        status_counts = {}
        type_counts = {}
        urgent_count = 0
        total_duration = 0
        duration_count = 0
        for a in appointments:
            status_counts[a.get("status", "unknown")] = status_counts.get(a.get("status", "unknown"), 0) + 1
            type_counts[a.get("type", "unknown")] = type_counts.get(a.get("type", "unknown"), 0) + 1
            if a.get("is_urgent"):
                urgent_count += 1
            if a.get("actual_start_time") and a.get("actual_end_time"):
                try:
                    s = datetime.fromisoformat(a["actual_start_time"])
                    e = datetime.fromisoformat(a["actual_end_time"])
                    total_duration += (e - s).total_seconds() / 60
                    duration_count += 1
                except (ValueError, TypeError):
                    pass

        avg_duration = f"{total_duration / duration_count:.0f} min" if duration_count else "N/A"
        status_str = ", ".join(f"{k}: {v}" for k, v in status_counts.items())
        type_str = ", ".join(f"{k}: {v}" for k, v in type_counts.items())
        appt_text = (
            f"Total: {len(appointments)} appointments\n"
            f"By status: {status_str}\n"
            f"By type: {type_str}\n"
            f"Urgent cases: {urgent_count}\n"
            f"Avg consultation duration: {avg_duration}"
        )

    prescriptions = data.get("prescriptions", [])
    if not prescriptions:
        rx_text = "No prescriptions issued in the last 90 days."
    else:
        all_meds = []
        for p in prescriptions:
            meds = p.get("medications", [])
            if isinstance(meds, list):
                for m in meds:
                    if isinstance(m, dict):
                        all_meds.append(m.get("name", "Unknown"))
        med_counts = {}
        for m in all_meds:
            med_counts[m] = med_counts.get(m, 0) + 1
        top_meds = sorted(med_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_meds_str = ", ".join(f"{name} ({count}x)" for name, count in top_meds)
        rx_text = f"Total prescriptions: {len(prescriptions)}\nTop medications: {top_meds_str}"

    unique_patients = data.get("unique_patients", [])
    if not unique_patients:
        patients_text = "No patients in the last 90 days."
    else:
        patients_text = f"Unique patients: {len(unique_patients)}"

    return DOCTOR_PRACTICE_USER.format(
        doctor_profile=doctor_profile,
        appointments=appt_text,
        prescriptions=rx_text,
        unique_patients=patients_text,
    )


DOCTOR_PRACTICE_INSIGHT_TYPES = ["patient_flow", "scheduling", "clinical_pattern", "efficiency", "growth"]


async def get_cached_practice_insights(user_id: str) -> InsightResponse | None:
    """Return cached practice insights if fresh enough."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=INSIGHT_CACHE_TTL)).isoformat()

    resp = (
        sb.table("ai_insights")
        .select("id, insight_type, title, description, severity, created_at")
        .eq("user_id", user_id)
        .in_("insight_type", DOCTOR_PRACTICE_INSIGHT_TYPES)
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )

    if not resp.data:
        return None

    insights = []
    for row in resp.data:
        try:
            desc = row.get("description", "")
            parts = desc.split("\n\nRecommendation: ", 1)
            description = parts[0]
            recommendation = parts[1] if len(parts) > 1 else ""
            insights.append(Insight(
                type=InsightType(row["insight_type"]),
                title=row.get("title", "Insight"),
                description=description,
                severity=Severity(row.get("severity", "low")),
                recommendation=recommendation,
            ))
        except (ValueError, KeyError):
            continue

    if not insights:
        return None

    return InsightResponse(
        success=True,
        insights=insights,
        cached=True,
        generated_at=resp.data[0].get("created_at"),
    )


async def generate_practice_insights(user_id: str) -> InsightResponse:
    """Generate AI practice insights for a doctor."""
    try:
        data = await get_doctor_data(user_id)

        if data.get("error"):
            return InsightResponse(success=False, error=data["error"])

        user_prompt = _format_practice_prompt(data)

        raw = generate_completion(
            system_prompt=DOCTOR_PRACTICE_SYSTEM,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.4,
        )

        # Reuse the same parser from insight_service
        from fastapi_backend.services.insight_service import _parse_insights
        insights = _parse_insights(raw)

        if not insights:
            return InsightResponse(
                success=False,
                error="Could not generate practice insights. Try again later.",
            )

        # Store in DB
        sb = get_supabase()
        sb.table("ai_insights").delete().eq("user_id", user_id).in_(
            "insight_type", DOCTOR_PRACTICE_INSIGHT_TYPES
        ).execute()

        now = datetime.now(timezone.utc).isoformat()
        rows = []
        for insight in insights:
            desc = insight.description
            if insight.recommendation:
                desc += f"\n\nRecommendation: {insight.recommendation}"
            rows.append({
                "user_id": user_id,
                "insight_type": insight.type.value,
                "title": insight.title,
                "description": desc,
                "severity": insight.severity.value,
                "action_required": insight.severity.value in ("high", "critical"),
                "created_at": now,
            })
        sb.table("ai_insights").insert(rows).execute()

        return InsightResponse(
            success=True,
            insights=insights,
            cached=False,
            generated_at=now,
        )

    except Exception as e:
        return InsightResponse(success=False, error=str(e))
