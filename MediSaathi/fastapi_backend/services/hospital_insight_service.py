"""Orchestrates hospital AI features: operational insights."""

import json
from datetime import datetime, timedelta, timezone

from fastapi_backend.config import INSIGHT_CACHE_TTL
from fastapi_backend.models.common import Insight, InsightType, Severity, InsightResponse
from fastapi_backend.services.data_aggregator import get_hospital_data
from fastapi_backend.services.llm_client import generate_completion
from fastapi_backend.services.supabase_client import get_supabase
from fastapi_backend.utils.prompt_templates import (
    HOSPITAL_INSIGHTS_SYSTEM,
    HOSPITAL_INSIGHTS_USER,
)


HOSPITAL_INSIGHT_TYPES = [
    "bed_utilization",
    "department_performance",
    "doctor_workload",
    "appointment_efficiency",
    "revenue_trend",
]


def _format_hospital_prompt(data: dict) -> str:
    """Build user prompt from aggregated hospital data."""
    hospital = data.get("hospital", {})
    user_info = hospital.get("users", {})
    admin_name = user_info.get("full_name", "Unknown") if isinstance(user_info, dict) else "Unknown"
    hospital_profile = (
        f"Name: {hospital.get('name', 'Unknown')}\n"
        f"Address: {hospital.get('address', 'Not specified')}\n"
        f"Admin: {admin_name}\n"
        f"Rating: {hospital.get('rating', 'N/A')}\n"
        f"Emergency Services: {'Yes' if hospital.get('emergency_services') else 'No'}\n"
        f"Departments: {hospital.get('departments', 'Not specified')}\n"
        f"Services: {hospital.get('services', 'Not specified')}"
    )

    # Bed statistics
    total_beds = hospital.get("total_beds", 0) or 0
    available_beds = hospital.get("available_beds", 0) or 0
    occupied = total_beds - available_beds
    occupancy_rate = f"{(occupied / total_beds * 100):.1f}%" if total_beds > 0 else "N/A"
    bed_stats = (
        f"Total beds: {total_beds}\n"
        f"Available beds: {available_beds}\n"
        f"Occupied beds: {occupied}\n"
        f"Occupancy rate: {occupancy_rate}"
    )

    # Department / specialty breakdown from doctors
    doctors = data.get("doctors", [])
    specialty_counts = {}
    for d in doctors:
        spec = d.get("specialty", "Unknown")
        specialty_counts[spec] = specialty_counts.get(spec, 0) + 1
    if specialty_counts:
        dept_lines = [f"- {spec}: {count} doctor(s)" for spec, count in specialty_counts.items()]
        department_breakdown = f"Total doctors: {len(doctors)}\n" + "\n".join(dept_lines)
    else:
        department_breakdown = "No doctors affiliated with this hospital."

    # Appointment statistics
    appointments = data.get("appointments", [])
    if not appointments:
        appointment_stats = "No appointments in the last 90 days."
    else:
        status_counts = {}
        type_counts = {}
        urgent_count = 0
        total_duration = 0
        duration_count = 0
        unique_patients = set()
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
            patient = a.get("patients", {})
            if isinstance(patient, dict) and patient.get("full_name"):
                unique_patients.add(patient["full_name"])

        avg_duration = f"{total_duration / duration_count:.0f} min" if duration_count else "N/A"
        status_str = ", ".join(f"{k}: {v}" for k, v in status_counts.items())
        type_str = ", ".join(f"{k}: {v}" for k, v in type_counts.items())

        completed = status_counts.get("completed", 0)
        no_show = status_counts.get("no_show", 0)
        cancelled = status_counts.get("cancelled", 0)
        no_show_rate = f"{(no_show / len(appointments) * 100):.1f}%" if appointments else "0%"
        cancel_rate = f"{(cancelled / len(appointments) * 100):.1f}%" if appointments else "0%"

        appointment_stats = (
            f"Total appointments: {len(appointments)}\n"
            f"By status: {status_str}\n"
            f"By type: {type_str}\n"
            f"Urgent cases: {urgent_count}\n"
            f"Unique patients: {len(unique_patients)}\n"
            f"Completed: {completed}, No-shows: {no_show} ({no_show_rate}), Cancelled: {cancelled} ({cancel_rate})\n"
            f"Avg consultation duration: {avg_duration}"
        )

    # Doctor workload
    if not doctors or not appointments:
        doctor_workload = "No doctor workload data available."
    else:
        doc_appt_counts = {}
        for a in appointments:
            did = a.get("doctor_id")
            if did:
                doc_appt_counts[did] = doc_appt_counts.get(did, 0) + 1

        doc_name_map = {}
        for d in doctors:
            user_info = d.get("users", {})
            name = user_info.get("full_name", "Unknown") if isinstance(user_info, dict) else "Unknown"
            doc_name_map[d.get("id", "")] = f"Dr. {name} ({d.get('specialty', 'N/A')})"

        workload_lines = []
        for did, count in sorted(doc_appt_counts.items(), key=lambda x: x[1], reverse=True):
            name = doc_name_map.get(did, "Unknown doctor")
            workload_lines.append(f"- {name}: {count} appointments")

        # Also show doctors with zero appointments
        for d in doctors:
            did = d.get("id", "")
            if did not in doc_appt_counts:
                name = doc_name_map.get(did, "Unknown doctor")
                workload_lines.append(f"- {name}: 0 appointments")

        doctor_workload = "\n".join(workload_lines)

    # Prescription activity
    prescriptions = data.get("prescriptions", [])
    if not prescriptions:
        prescription_stats = "No prescriptions issued in the last 90 days."
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
        prescription_stats = f"Total prescriptions: {len(prescriptions)}\nTop medications: {top_meds_str}"

    return HOSPITAL_INSIGHTS_USER.format(
        hospital_profile=hospital_profile,
        bed_stats=bed_stats,
        department_breakdown=department_breakdown,
        appointment_stats=appointment_stats,
        doctor_workload=doctor_workload,
        prescription_stats=prescription_stats,
    )


async def get_cached_hospital_insights(user_id: str) -> InsightResponse | None:
    """Return cached hospital insights if fresh enough."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=INSIGHT_CACHE_TTL)).isoformat()

    resp = (
        sb.table("ai_insights")
        .select("id, insight_type, title, description, severity, created_at")
        .eq("user_id", user_id)
        .in_("insight_type", HOSPITAL_INSIGHT_TYPES)
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


async def generate_hospital_insights(user_id: str) -> InsightResponse:
    """Generate AI operational insights for a hospital."""
    try:
        data = await get_hospital_data(user_id)

        if data.get("error"):
            return InsightResponse(success=False, error=data["error"])

        user_prompt = _format_hospital_prompt(data)

        raw = generate_completion(
            system_prompt=HOSPITAL_INSIGHTS_SYSTEM,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.4,
        )

        from fastapi_backend.services.insight_service import _parse_insights
        insights = _parse_insights(raw)

        if not insights:
            return InsightResponse(
                success=False,
                error="Could not generate hospital insights. Try again later.",
            )

        # Store in DB (replace old ones)
        sb = get_supabase()
        sb.table("ai_insights").delete().eq("user_id", user_id).in_(
            "insight_type", HOSPITAL_INSIGHT_TYPES
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
