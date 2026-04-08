"""Fetch and aggregate data from Supabase for each user type."""

from datetime import datetime, timedelta
from fastapi_backend.services.supabase_client import get_supabase


async def get_patient_data(user_id: str) -> dict:
    """Aggregate all relevant patient data for AI insight generation.

    Returns a dict with keys:
      - user: basic profile
      - vitals: recent vital signs (last 30 days)
      - appointments: recent + upcoming appointments
      - prescriptions: active prescriptions
      - health_records: recent records
      - wallet: spending summary
    """
    sb = get_supabase()
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()

    # --- User profile ---
    user_resp = sb.table("users").select("id, full_name, date_of_birth, gender, phone").eq("id", user_id).single().execute()
    user = user_resp.data if user_resp.data else {}

    # --- Vital signs (last 30 days, latest 20) ---
    vitals_resp = (
        sb.table("vital_signs")
        .select("type, value, unit, recorded_at")
        .eq("user_id", user_id)
        .gte("recorded_at", thirty_days_ago)
        .order("recorded_at", desc=True)
        .limit(20)
        .execute()
    )
    vitals = vitals_resp.data or []

    # --- Appointments (last 90 days + upcoming) ---
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()
    appt_resp = (
        sb.table("appointments")
        .select("appointment_date, appointment_time, type, status, notes, doctors:doctor_id(specialty, users:user_id(full_name))")
        .eq("patient_id", user_id)
        .gte("appointment_date", ninety_days_ago[:10])
        .order("appointment_date", desc=True)
        .limit(15)
        .execute()
    )
    appointments = appt_resp.data or []

    # --- Active prescriptions ---
    today = datetime.utcnow().strftime("%Y-%m-%d")
    rx_resp = (
        sb.table("prescriptions")
        .select("medications, instructions, valid_until, status, created_at, doctors:doctor_id(specialty, users:user_id(full_name))")
        .eq("patient_id", user_id)
        .eq("status", "active")
        .gte("valid_until", today)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    prescriptions = rx_resp.data or []

    # --- Recent health records ---
    records_resp = (
        sb.table("health_records")
        .select("title, type, date_recorded, ai_summary, is_critical")
        .eq("user_id", user_id)
        .order("date_recorded", desc=True)
        .limit(10)
        .execute()
    )
    health_records = records_resp.data or []

    # --- Wallet summary (last 3 months) ---
    three_months_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()
    wallet_resp = (
        sb.table("health_wallet")
        .select("transaction_type, amount, category, date_occurred")
        .eq("user_id", user_id)
        .gte("date_occurred", three_months_ago[:10])
        .order("date_occurred", desc=True)
        .limit(20)
        .execute()
    )
    wallet = wallet_resp.data or []

    return {
        "user": user,
        "vitals": vitals,
        "appointments": appointments,
        "prescriptions": prescriptions,
        "health_records": health_records,
        "wallet": wallet,
    }


async def get_family_member_data(user_id: str, family_member_id: str) -> dict:
    """Aggregate health data for a specific family member.

    Fetches member profile, vitals, appointments, and health records
    filtered by family_member_id. Prescriptions/wallet excluded (no FK).
    """
    sb = get_supabase()
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()

    # --- Family member profile ---
    member_resp = (
        sb.table("family_members")
        .select("id, full_name, relationship, date_of_birth, gender, phone")
        .eq("id", family_member_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    member = member_resp.data if member_resp.data else {}

    # --- Vital signs (last 30 days) ---
    vitals_resp = (
        sb.table("vital_signs")
        .select("type, value, unit, recorded_at")
        .eq("user_id", user_id)
        .eq("family_member_id", family_member_id)
        .gte("recorded_at", thirty_days_ago)
        .order("recorded_at", desc=True)
        .limit(20)
        .execute()
    )
    vitals = vitals_resp.data or []

    # --- Appointments (last 90 days) ---
    appt_resp = (
        sb.table("appointments")
        .select("appointment_date, appointment_time, type, status, notes, "
                "doctors:doctor_id(specialty, users:user_id(full_name))")
        .eq("patient_id", user_id)
        .eq("family_member_id", family_member_id)
        .gte("appointment_date", ninety_days_ago[:10])
        .order("appointment_date", desc=True)
        .limit(15)
        .execute()
    )
    appointments = appt_resp.data or []

    # --- Health records ---
    records_resp = (
        sb.table("health_records")
        .select("title, type, date_recorded, ai_summary, is_critical")
        .eq("user_id", user_id)
        .eq("family_member_id", family_member_id)
        .order("date_recorded", desc=True)
        .limit(10)
        .execute()
    )
    health_records = records_resp.data or []

    return {
        "member": member,
        "vitals": vitals,
        "appointments": appointments,
        "health_records": health_records,
    }


async def get_doctor_patient_data(doctor_id: str, patient_id: str) -> dict:
    """Aggregate a specific patient's data for doctor's AI patient briefing.

    Uses doctor_id (from doctors table, NOT user_id) and patient_id (user_id of the patient).
    """
    sb = get_supabase()
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # --- Patient profile ---
    user_resp = sb.table("users").select("id, full_name, date_of_birth, gender, phone").eq("id", patient_id).single().execute()
    patient = user_resp.data if user_resp.data else {}

    # --- Vital signs (last 30 days) ---
    vitals_resp = (
        sb.table("vital_signs")
        .select("type, value, unit, recorded_at, notes")
        .eq("user_id", patient_id)
        .gte("recorded_at", thirty_days_ago)
        .order("recorded_at", desc=True)
        .limit(20)
        .execute()
    )
    vitals = vitals_resp.data or []

    # --- Appointments with THIS doctor (last 6 months) ---
    six_months_ago = (datetime.utcnow() - timedelta(days=180)).isoformat()
    appt_resp = (
        sb.table("appointments")
        .select("appointment_date, appointment_time, type, status, notes, reason, actual_start_time, actual_end_time")
        .eq("patient_id", patient_id)
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", six_months_ago[:10])
        .order("appointment_date", desc=True)
        .limit(20)
        .execute()
    )
    doctor_appointments = appt_resp.data or []

    # --- Appointments with OTHER doctors (last 90 days) ---
    other_appt_resp = (
        sb.table("appointments")
        .select("appointment_date, type, status, doctors:doctor_id(specialty, users:user_id(full_name))")
        .eq("patient_id", patient_id)
        .neq("doctor_id", doctor_id)
        .gte("appointment_date", ninety_days_ago[:10])
        .order("appointment_date", desc=True)
        .limit(10)
        .execute()
    )
    other_appointments = other_appt_resp.data or []

    # --- Prescriptions by THIS doctor ---
    rx_resp = (
        sb.table("prescriptions")
        .select("medications, instructions, valid_until, status, created_at")
        .eq("patient_id", patient_id)
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    doctor_prescriptions = rx_resp.data or []

    # --- ALL active prescriptions (to check interactions) ---
    all_rx_resp = (
        sb.table("prescriptions")
        .select("medications, instructions, valid_until, status, created_at, doctors:doctor_id(specialty, users:user_id(full_name))")
        .eq("patient_id", patient_id)
        .eq("status", "active")
        .gte("valid_until", today)
        .order("created_at", desc=True)
        .limit(15)
        .execute()
    )
    all_active_prescriptions = all_rx_resp.data or []

    # --- Health records ---
    records_resp = (
        sb.table("health_records")
        .select("title, type, date_recorded, ai_summary, is_critical, content")
        .eq("user_id", patient_id)
        .order("date_recorded", desc=True)
        .limit(15)
        .execute()
    )
    health_records = records_resp.data or []

    return {
        "patient": patient,
        "vitals": vitals,
        "doctor_appointments": doctor_appointments,
        "other_appointments": other_appointments,
        "doctor_prescriptions": doctor_prescriptions,
        "all_active_prescriptions": all_active_prescriptions,
        "health_records": health_records,
    }


async def get_doctor_data(user_id: str) -> dict:
    """Aggregate doctor's practice data for AI practice insights.

    user_id is the doctor's user_id (from users table).
    """
    sb = get_supabase()
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()

    # --- Doctor profile ---
    doc_resp = sb.table("doctors").select("id, specialty, license_number, users:user_id(full_name, gender)").eq("user_id", user_id).single().execute()
    doctor = doc_resp.data if doc_resp.data else {}
    doctor_id = doctor.get("id")
    if not doctor_id:
        return {"doctor": {}, "error": "Doctor profile not found"}

    # --- Appointments (last 90 days) ---
    appt_resp = (
        sb.table("appointments")
        .select("appointment_date, appointment_time, type, status, notes, actual_start_time, actual_end_time, is_urgent, patients:patient_id(full_name, gender, date_of_birth)")
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", ninety_days_ago[:10])
        .order("appointment_date", desc=True)
        .limit(50)
        .execute()
    )
    appointments = appt_resp.data or []

    # --- Prescriptions issued (last 90 days) ---
    rx_resp = (
        sb.table("prescriptions")
        .select("medications, status, valid_until, created_at")
        .eq("doctor_id", doctor_id)
        .gte("created_at", ninety_days_ago)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    prescriptions = rx_resp.data or []

    # --- Unique patients (last 90 days) ---
    patient_resp = (
        sb.table("appointments")
        .select("patient_id, patients:patient_id(full_name, gender, date_of_birth)")
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", ninety_days_ago[:10])
        .execute()
    )
    patients_raw = patient_resp.data or []
    # Deduplicate by patient_id
    seen = set()
    unique_patients = []
    for p in patients_raw:
        pid = p.get("patient_id")
        if pid and pid not in seen:
            seen.add(pid)
            unique_patients.append(p)

    return {
        "doctor": doctor,
        "doctor_id": doctor_id,
        "appointments": appointments,
        "prescriptions": prescriptions,
        "unique_patients": unique_patients,
    }


async def get_hospital_data(user_id: str) -> dict:
    """Aggregate hospital data for AI operational insights.

    user_id is the hospital admin's user_id (from users table).
    Returns: hospital profile, doctors, appointments, bed stats, revenue.
    """
    sb = get_supabase()
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()

    # --- Hospital profile ---
    hosp_resp = (
        sb.table("hospitals")
        .select("id, name, address, total_beds, available_beds, departments, services, emergency_services, rating, users:user_id(full_name, email)")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    hospital = hosp_resp.data if hosp_resp.data else {}
    hospital_id = hospital.get("id")
    if not hospital_id:
        return {"hospital": {}, "error": "Hospital profile not found"}

    # --- Doctors affiliated with this hospital ---
    docs_resp = (
        sb.table("doctors")
        .select("id, specialty, available_days, available_hours, consultation_fee, experience_years, users:user_id(full_name)")
        .eq("hospital_id", hospital_id)
        .execute()
    )
    doctors = docs_resp.data or []
    doctor_ids = [d["id"] for d in doctors if d.get("id")]

    # --- Appointments for all hospital doctors (last 90 days) ---
    appointments = []
    if doctor_ids:
        appt_resp = (
            sb.table("appointments")
            .select("appointment_date, type, status, is_urgent, actual_start_time, actual_end_time, doctor_id, patients:patient_id(full_name, gender, date_of_birth)")
            .in_("doctor_id", doctor_ids)
            .gte("appointment_date", ninety_days_ago[:10])
            .order("appointment_date", desc=True)
            .limit(200)
            .execute()
        )
        appointments = appt_resp.data or []

    # --- Prescriptions by hospital doctors (last 90 days) ---
    prescriptions = []
    if doctor_ids:
        rx_resp = (
            sb.table("prescriptions")
            .select("medications, status, doctor_id, created_at")
            .in_("doctor_id", doctor_ids)
            .gte("created_at", ninety_days_ago)
            .limit(100)
            .execute()
        )
        prescriptions = rx_resp.data or []

    return {
        "hospital": hospital,
        "hospital_id": hospital_id,
        "doctors": doctors,
        "appointments": appointments,
        "prescriptions": prescriptions,
    }
