"""Orchestrates patient data aggregation, LLM insight generation, and DB storage."""

import json
from datetime import datetime, timedelta, timezone

from fastapi_backend.config import INSIGHT_CACHE_TTL
from fastapi_backend.models.common import Insight, InsightType, Severity, InsightResponse
from fastapi_backend.services.data_aggregator import get_patient_data, get_family_member_data
from fastapi_backend.services.llm_client import generate_completion
from fastapi_backend.services.supabase_client import get_supabase
from fastapi_backend.utils.prompt_templates import (
    PATIENT_INSIGHT_SYSTEM,
    PATIENT_INSIGHT_USER,
)


def _format_patient_prompt(data: dict) -> str:
    """Build the user prompt from aggregated patient data."""
    user = data.get("user", {})
    age = ""
    if user.get("date_of_birth"):
        try:
            born = datetime.strptime(user["date_of_birth"], "%Y-%m-%d")
            age = f", Age: {(datetime.utcnow() - born).days // 365}"
        except ValueError:
            pass

    user_profile = f"Name: {user.get('full_name', 'Unknown')}{age}, Gender: {user.get('gender', 'Not specified')}"

    vitals = data.get("vitals", [])
    vitals_text = "No recent vitals recorded." if not vitals else "\n".join(
        f"- {v.get('type', '?')}: {v.get('value', '?')} {v.get('unit', '')} (recorded: {v.get('recorded_at', '?')[:10]})"
        for v in vitals
    )

    appointments = data.get("appointments", [])
    if not appointments:
        appt_text = "No recent appointments."
    else:
        lines = []
        for a in appointments:
            doc = a.get("doctors", {})
            doc_name = doc.get("users", {}).get("full_name", "Unknown") if isinstance(doc, dict) else "Unknown"
            specialty = doc.get("specialty", "") if isinstance(doc, dict) else ""
            lines.append(
                f"- {a.get('appointment_date', '?')} {a.get('appointment_time', '')}: "
                f"{a.get('type', '?')} with Dr. {doc_name} ({specialty}) — {a.get('status', '?')}"
            )
        appt_text = "\n".join(lines)

    prescriptions = data.get("prescriptions", [])
    if not prescriptions:
        rx_text = "No active prescriptions."
    else:
        lines = []
        for p in prescriptions:
            doc = p.get("doctors", {})
            doc_name = doc.get("users", {}).get("full_name", "Unknown") if isinstance(doc, dict) else "Unknown"
            meds = p.get("medications", [])
            if isinstance(meds, list) and meds:
                med_names = ", ".join(
                    f"{m.get('name', '?')} {m.get('dosage', '')} ({m.get('frequency', '')})"
                    for m in meds if isinstance(m, dict)
                )
            else:
                med_names = "Unknown medication"
            lines.append(
                f"- {med_names} (until {p.get('valid_until', '?')}) — prescribed by Dr. {doc_name}"
            )
        rx_text = "\n".join(lines)

    records = data.get("health_records", [])
    records_text = "No recent health records." if not records else "\n".join(
        f"- {r.get('date_recorded', '?')}: {r.get('title', '?')} ({r.get('type', '?')})"
        for r in records
    )

    wallet = data.get("wallet", [])
    if not wallet:
        wallet_text = "No recent transactions."
    else:
        total = sum(float(w.get("amount", 0)) for w in wallet if w.get("transaction_type") == "expense")
        categories = {}
        for w in wallet:
            if w.get("transaction_type") == "expense":
                cat = w.get("category", "other")
                categories[cat] = categories.get(cat, 0) + float(w.get("amount", 0))
        cat_text = ", ".join(f"{k}: ${v:.0f}" for k, v in categories.items())
        wallet_text = f"Total spent: ${total:.0f}. Breakdown: {cat_text}"

    return PATIENT_INSIGHT_USER.format(
        user_profile=user_profile,
        vitals=vitals_text,
        appointments=appt_text,
        prescriptions=rx_text,
        health_records=records_text,
        wallet=wallet_text,
    )


def _parse_insights(raw: str) -> list[Insight]:
    """Parse LLM JSON response into Insight objects. Handles edge cases."""
    # Strip markdown code fences if present
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # remove first line
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        items = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON array from the text
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1:
            try:
                items = json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                return []
        else:
            return []

    if not isinstance(items, list):
        return []

    insights = []
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            insight = Insight(
                type=InsightType(item.get("type", "health_trend")),
                title=item.get("title", "Health Insight"),
                description=item.get("description", ""),
                severity=Severity(item.get("severity", "low")),
                recommendation=item.get("recommendation", ""),
            )
            insights.append(insight)
        except (ValueError, KeyError):
            continue

    return insights


async def get_cached_insights(user_id: str) -> InsightResponse | None:
    """Return cached insights if they exist and are fresh enough."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=INSIGHT_CACHE_TTL)).isoformat()

    resp = (
        sb.table("ai_insights")
        .select("id, insight_type, title, description, severity, action_required, created_at")
        .eq("user_id", user_id)
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
            # recommendation is stored as part of description (after \n\n)
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


async def generate_patient_insights(user_id: str) -> InsightResponse:
    """Full pipeline: aggregate data → call LLM → parse → store → return."""
    try:
        # 1. Aggregate patient data
        data = await get_patient_data(user_id)

        # 2. Build prompt
        user_prompt = _format_patient_prompt(data)

        # 3. Call LLM
        raw_response = generate_completion(
            system_prompt=PATIENT_INSIGHT_SYSTEM,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.4,
        )

        # 4. Parse response
        insights = _parse_insights(raw_response)

        if not insights:
            return InsightResponse(
                success=False,
                error="Could not generate insights from the available data. Try adding more health records or vitals.",
            )

        # 5. Store in DB (clear old insights first, then insert new)
        sb = get_supabase()
        sb.table("ai_insights").delete().eq("user_id", user_id).in_(
            "insight_type", ["risk_prediction", "health_trend", "medication_reminder", "checkup_due"]
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


def _format_family_member_prompt(data: dict) -> str:
    """Build the user prompt from aggregated family member data."""
    member = data.get("member", {})
    age = ""
    if member.get("date_of_birth"):
        try:
            born = datetime.strptime(member["date_of_birth"], "%Y-%m-%d")
            age = f", Age: {(datetime.utcnow() - born).days // 365}"
        except ValueError:
            pass

    user_profile = (
        f"Name: {member.get('full_name', 'Unknown')}{age}, "
        f"Gender: {member.get('gender', 'Not specified')}, "
        f"Relationship: {member.get('relationship', 'family member')}"
    )

    vitals = data.get("vitals", [])
    vitals_text = "No recent vitals recorded." if not vitals else "\n".join(
        f"- {v.get('type', '?')}: {v.get('value', '?')} {v.get('unit', '')} (recorded: {v.get('recorded_at', '?')[:10]})"
        for v in vitals
    )

    appointments = data.get("appointments", [])
    if not appointments:
        appt_text = "No recent appointments."
    else:
        lines = []
        for a in appointments:
            doc = a.get("doctors", {})
            doc_name = doc.get("users", {}).get("full_name", "Unknown") if isinstance(doc, dict) else "Unknown"
            specialty = doc.get("specialty", "") if isinstance(doc, dict) else ""
            lines.append(
                f"- {a.get('appointment_date', '?')} {a.get('appointment_time', '')}: "
                f"{a.get('type', '?')} with Dr. {doc_name} ({specialty}) — {a.get('status', '?')}"
            )
        appt_text = "\n".join(lines)

    records = data.get("health_records", [])
    records_text = "No recent health records." if not records else "\n".join(
        f"- {r.get('date_recorded', '?')}: {r.get('title', '?')} ({r.get('type', '?')})"
        for r in records
    )

    return PATIENT_INSIGHT_USER.format(
        user_profile=user_profile,
        vitals=vitals_text,
        appointments=appt_text,
        prescriptions="Not applicable for family members.",
        health_records=records_text,
        wallet="Not applicable for family members.",
    )


async def get_cached_family_insights(user_id: str, family_member_id: str) -> InsightResponse | None:
    """Return cached insights for a family member if fresh enough."""
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=INSIGHT_CACHE_TTL)).isoformat()

    resp = (
        sb.table("ai_insights")
        .select("id, insight_type, title, description, severity, action_required, created_at")
        .eq("user_id", user_id)
        .eq("family_member_id", family_member_id)
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


async def generate_family_member_insights(user_id: str, family_member_id: str) -> InsightResponse:
    """Full pipeline for family member: aggregate → LLM → parse → store → return."""
    try:
        data = await get_family_member_data(user_id, family_member_id)
        user_prompt = _format_family_member_prompt(data)

        raw_response = generate_completion(
            system_prompt=PATIENT_INSIGHT_SYSTEM,
            user_prompt=user_prompt,
            max_tokens=1024,
            temperature=0.4,
        )

        insights = _parse_insights(raw_response)

        if not insights:
            return InsightResponse(
                success=False,
                error="Could not generate insights. Try adding more vitals or appointments for this family member.",
            )

        sb = get_supabase()
        sb.table("ai_insights").delete().eq("user_id", user_id).eq(
            "family_member_id", family_member_id
        ).in_(
            "insight_type", ["risk_prediction", "health_trend", "medication_reminder", "checkup_due"]
        ).execute()

        now = datetime.now(timezone.utc).isoformat()
        rows = []
        for insight in insights:
            desc = insight.description
            if insight.recommendation:
                desc += f"\n\nRecommendation: {insight.recommendation}"
            rows.append({
                "user_id": user_id,
                "family_member_id": family_member_id,
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
