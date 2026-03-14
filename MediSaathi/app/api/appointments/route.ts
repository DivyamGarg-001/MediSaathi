import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { AppointmentService } from '@/lib/services/appointment.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const doctorId = searchParams.get('doctorId')
    const userType = searchParams.get('userType')
    const action = searchParams.get('action')
    const date = searchParams.get('date')

    // Handle doctor-specific queries
    if (doctorId && date) {
      // Get appointments for a specific doctor on a specific date
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          type,
          is_urgent,
          patients:patient_id (
            id,
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
        .eq('appointment_date', date)
        .order('appointment_time', { ascending: true })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch doctor appointments',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        data: appointments || [] 
      })
    }

    // Handle patient-specific queries (existing logic)
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID or Doctor ID is required' 
      }, { status: 400 })
    }

    if (action === 'upcoming' || !action) {
      // Get upcoming appointments for patient
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          doctors:doctor_id (
            id,
            specialty,
            users:user_id (
              full_name,
              email
            )
          )
        `)
        .eq('patient_id', userId)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch appointments',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        data: appointments || [] 
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, appointmentData } = body

    switch (action) {
      case 'book':
        if (!appointmentData.patient_id || !appointmentData.doctor_id || !appointmentData.appointment_date || !appointmentData.appointment_time) {
          return NextResponse.json({ success: false, error: 'Required appointment data missing' }, { status: 400 })
        }
        
        const bookResult = await AppointmentService.bookAppointment(appointmentData)
        if (bookResult.error) throw bookResult.error
        
        return NextResponse.json({ 
          success: true, 
          data: bookResult.data,
          message: 'Appointment booked successfully' 
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Appointment Booking Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to book appointment' 
    }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, appointmentId, updates, reason } = body

    if (!appointmentId) {
      return NextResponse.json({ success: false, error: 'Appointment ID required' }, { status: 400 })
    }

    switch (action) {
      case 'update':
        const updateResult = await AppointmentService.updateAppointment(appointmentId, updates)
        if (updateResult.error) throw updateResult.error
        
        return NextResponse.json({ 
          success: true, 
          data: updateResult.data,
          message: 'Appointment updated successfully' 
        })

      case 'cancel':
        const cancelResult = await AppointmentService.cancelAppointment(appointmentId, reason)
        if (cancelResult.error) throw cancelResult.error
        
        return NextResponse.json({ 
          success: true, 
          data: cancelResult.data,
          message: 'Appointment cancelled successfully' 
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Appointment Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 })
  }
}