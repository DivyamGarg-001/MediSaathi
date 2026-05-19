import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const recent = searchParams.get('recent')
    const critical = searchParams.get('critical')
    const limit = searchParams.get('limit')

    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID is required'
      }, { status: 400 })
    }

    // Build query: appointments joined with patient user data
    let query = supabase
      .from('appointments')
      .select(`
        patient_id,
        appointment_date,
        status,
        reason,
        is_urgent,
        family_member_id,
        family_members:family_member_id (id, full_name, relationship),
        patient:patient_id (
          id,
          full_name,
          email,
          avatar_url,
          date_of_birth
        )
      `)
      .eq('doctor_id', doctorId)

    if (recent === 'true') {
      query = query.order('appointment_date', { ascending: false })
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch patients',
        details: error.message
      }, { status: 500 })
    }

    // Extract unique patients with nearest upcoming or most recent past appointment
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const patientsMap = new Map()
    appointments?.forEach((appointment: any) => {
      if (!appointment.patient) return
      if (appointment.status === 'cancelled') return
      const existing = patientsMap.get(appointment.patient_id)
      const apptDate = appointment.appointment_date
      const isFuture = apptDate >= todayStr

      if (!existing) {
        patientsMap.set(appointment.patient_id, {
          ...appointment.patient,
          last_appointment: apptDate,
          next_appointment: isFuture ? apptDate : null,
          last_status: appointment.status,
          is_urgent: appointment.is_urgent,
          // Map of family_member_id -> { id, full_name, relationship } for de-duped chips
          family_members_seen: {} as Record<string, { id: string; full_name: string; relationship: string }>,
        })
      } else {
        // Track nearest upcoming appointment
        if (isFuture && (!existing.next_appointment || apptDate < existing.next_appointment)) {
          existing.next_appointment = apptDate
        }
        // Track most recent past/today appointment
        if (!isFuture && (!existing.last_appointment || apptDate > existing.last_appointment)) {
          existing.last_appointment = apptDate
        }
        if (appointment.is_urgent) existing.is_urgent = true
      }

      // Aggregate which family members this patient has appointments for
      const patientEntry = patientsMap.get(appointment.patient_id)
      if (appointment.family_member_id && appointment.family_members) {
        patientEntry.family_members_seen[appointment.family_member_id] = appointment.family_members
      }
    })

    // Flatten the family_members_seen map into a list before returning
    patientsMap.forEach((entry) => {
      entry.family_members = Object.values(entry.family_members_seen)
      delete entry.family_members_seen
    })

    let patients = Array.from(patientsMap.values())

    // Filter critical (urgent) patients if requested
    if (critical === 'true') {
      patients = patients.filter(p => p.is_urgent)
    }

    return NextResponse.json({
      success: true,
      data: patients,
      total: patients.length
    })

  } catch (error) {
    console.error('Doctors patients API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
