import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const action = searchParams.get('action') || 'patients'
    const recent = searchParams.get('recent')
    const critical = searchParams.get('critical')
    const limit = searchParams.get('limit')

    if (!doctorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Doctor ID is required' 
      }, { status: 400 })
    }

    if (action === 'patients' || !action) {
      // Get patients for this doctor based on appointments
      let query = supabase
        .from('appointments')
        .select(`
          patient_id,
          patients:patient_id (
            id,
            primary_condition,
            risk_level,
            critical_notes,
            last_appointment,
            users:user_id (
              id,
              full_name,
              email,
              avatar_url,
              date_of_birth
            )
          )
        `)
        .eq('doctor_id', doctorId)

      // Apply filters
      if (critical === 'true') {
        query = query.eq('patients.risk_level', 'high')
      }

      if (recent === 'true') {
        query = query.order('created_at', { ascending: false })
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

      // Extract unique patients from appointments
      const patientsMap = new Map()
      appointments?.forEach((appointment: any) => {
        if (appointment.patients && !patientsMap.has(appointment.patient_id)) {
          patientsMap.set(appointment.patient_id, appointment.patients)
        }
      })

      const patients = Array.from(patientsMap.values())

      if (action === 'patients') {
        return NextResponse.json({ 
          success: true, 
          data: patients,
          total: patients.length
        })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Doctors API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}