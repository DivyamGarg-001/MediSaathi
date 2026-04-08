import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { AppointmentService } from '@/lib/services/appointment.service'
import { NotificationService } from '@/lib/services/notification.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const doctorId = searchParams.get('doctorId')
    const userType = searchParams.get('userType')
    const action = searchParams.get('action')
    const date = searchParams.get('date')

    // Time tracking analytics
    if (action === 'time-tracking' && doctorId) {
      const result = await AppointmentService.getTimeTrackingAnalytics(doctorId)
      if (result.error) throw result.error
      return NextResponse.json({ success: true, data: result.data })
    }

    // Available slots for booking
    if (action === 'available-slots' && doctorId) {
      const date = searchParams.get('date')
      if (!date) return NextResponse.json({ success: false, error: 'Date required' }, { status: 400 })
      const result = await AppointmentService.getAvailableSlots(doctorId, date)
      if (result.error) throw result.error
      return NextResponse.json({ success: true, data: result.data })
    }

    // Handle doctor-specific queries
    if (doctorId && date) {
      // Get appointments for a specific doctor on a specific date
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          appointment_date,
          appointment_time,
          status,
          notes,
          type,
          is_urgent,
          patient:patient_id (
            id,
            full_name,
            email,
            avatar_url,
            date_of_birth
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
          family_member_id,
          doctors:doctor_id (
            id,
            specialty,
            hospital_id,
            users:user_id (
              full_name,
              email
            ),
            hospitals:hospital_id (
              name
            )
          ),
          family_members:family_member_id (
            id,
            full_name,
            relationship
          )
        `)
        .eq('patient_id', userId)
        .neq('status', 'cancelled')
        .gte('appointment_date', (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })())
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
      case 'book': {
        if (!appointmentData.patient_id || !appointmentData.doctor_id || !appointmentData.appointment_date || !appointmentData.appointment_time) {
          return NextResponse.json({ success: false, error: 'Required appointment data missing' }, { status: 400 })
        }

        const bookResult = await AppointmentService.bookAppointment(appointmentData)
        if (bookResult.error) throw bookResult.error

        // Send notification to doctor about new appointment
        try {
          const [doctorInfo, patientInfo] = await Promise.all([
            supabase.from('doctors').select('user_id').eq('id', appointmentData.doctor_id).single(),
            supabase.from('users').select('full_name').eq('id', appointmentData.patient_id).single()
          ])
          let bookingForText = ''
          if (appointmentData.family_member_id) {
            const { data: fm } = await supabase.from('family_members').select('full_name').eq('id', appointmentData.family_member_id).single()
            bookingForText = fm?.full_name ? ` (for ${fm.full_name})` : ''
          }
          if (doctorInfo.data?.user_id) {
            await NotificationService.createNotification({
              user_id: doctorInfo.data.user_id,
              type: 'appointment_booked',
              title: 'New Appointment Booked',
              message: `${patientInfo.data?.full_name || 'A patient'}${bookingForText} booked a ${appointmentData.type || 'consultation'} appointment on ${appointmentData.appointment_date} at ${appointmentData.appointment_time}.`,
              related_appointment_id: bookResult.data?.[0]?.id || null
            })
          }
        } catch (notifErr) {
          console.error('Failed to send booking notification:', notifErr)
        }

        return NextResponse.json({
          success: true,
          data: bookResult.data,
          message: 'Appointment booked successfully'
        })
      }

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

      case 'cancel': {
        // Get appointment details before cancelling to send notification
        const { data: apptDetails } = await supabase
          .from('appointments')
          .select('doctor_id, patient_id, appointment_date, appointment_time, doctors:doctor_id(user_id), patients:patient_id(full_name)')
          .eq('id', appointmentId)
          .single()

        const cancelResult = await AppointmentService.cancelAppointment(appointmentId, reason)
        if (cancelResult.error) throw cancelResult.error

        // Send notification to doctor
        if (apptDetails?.doctors?.user_id) {
          const patientName = (apptDetails.patients as any)?.full_name || 'A patient'
          await NotificationService.createNotification({
            user_id: apptDetails.doctors.user_id,
            type: 'appointment_cancelled',
            title: 'Appointment Cancelled',
            message: `${patientName} cancelled their appointment on ${apptDetails.appointment_date} at ${apptDetails.appointment_time}.${reason ? ` Reason: ${reason}` : ''}`,
            related_appointment_id: appointmentId,
          })
        }

        return NextResponse.json({
          success: true,
          data: cancelResult.data,
          message: 'Appointment cancelled successfully'
        })
      }

      case 'reschedule': {
        const { newDate, newTime } = body

        if (!newDate || !newTime) {
          return NextResponse.json({ success: false, error: 'New date and time required for rescheduling' }, { status: 400 })
        }

        // Get current appointment details
        const { data: currentAppt } = await supabase
          .from('appointments')
          .select('doctor_id, patient_id, appointment_date, appointment_time, doctors:doctor_id(user_id), patients:patient_id(full_name)')
          .eq('id', appointmentId)
          .single()

        if (!currentAppt) {
          return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
        }

        // Check for conflicts on the new slot
        const { data: conflicts } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', currentAppt.doctor_id)
          .eq('appointment_date', newDate)
          .eq('appointment_time', newTime)
          .neq('status', 'cancelled')
          .neq('id', appointmentId)

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({ success: false, error: 'New time slot is already booked' }, { status: 400 })
        }

        // Update the appointment with new date/time
        const rescheduleResult = await AppointmentService.updateAppointment(appointmentId, {
          appointment_date: newDate,
          appointment_time: newTime,
          notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled by patient',
        })
        if (rescheduleResult.error) throw rescheduleResult.error

        // Send notification to doctor
        if (currentAppt?.doctors?.user_id) {
          const patientName = (currentAppt.patients as any)?.full_name || 'A patient'
          await NotificationService.createNotification({
            user_id: currentAppt.doctors.user_id,
            type: 'appointment_rescheduled',
            title: 'Appointment Rescheduled',
            message: `${patientName} rescheduled their appointment from ${currentAppt.appointment_date} at ${currentAppt.appointment_time} to ${newDate} at ${newTime}.${reason ? ` Reason: ${reason}` : ''}`,
            related_appointment_id: appointmentId,
          })
        }

        return NextResponse.json({
          success: true,
          data: rescheduleResult.data,
          message: 'Appointment rescheduled successfully'
        })
      }

      case 'start-consultation':
        const startResult = await AppointmentService.startConsultation(appointmentId)
        if (startResult.error) throw startResult.error
        return NextResponse.json({ success: true, data: startResult.data, message: 'Consultation started' })

      case 'end-consultation':
        const endResult = await AppointmentService.endConsultation(appointmentId)
        if (endResult.error) throw endResult.error
        return NextResponse.json({ success: true, data: endResult.data, message: 'Consultation ended' })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Appointment Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 })
  }
}