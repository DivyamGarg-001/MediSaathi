import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

export class AppointmentService {
  // Get appointments for patient
  static async getPatientAppointments(patientId: string, status?: string) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id(
            id,
            users!doctors_user_id_fkey(full_name, avatar_url),
            specialty,
            consultation_fee
          ),
          hospitals:hospital_id(name, address, phone)
        `)
        .eq('patient_id', patientId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get appointments for doctor
  static async getDoctorAppointments(doctorId: string, date?: string) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(full_name, avatar_url, phone, date_of_birth),
          hospitals:hospital_id(name)
        `)
        .eq('doctor_id', doctorId)

      if (date) {
        query = query.eq('appointment_date', date)
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get appointments for hospital
  static async getHospitalAppointments(hospitalId: string, date?: string) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(full_name, phone),
          doctors:doctor_id(
            users!doctors_user_id_fkey(full_name),
            specialty
          )
        `)
        .eq('hospital_id', hospitalId)

      if (date) {
        query = query.eq('appointment_date', date)
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Book new appointment
  static async bookAppointment(appointmentData: AppointmentInsert) {
    try {
      // Check if doctor is available on this day
      const { data: doctorInfo } = await supabase
        .from('doctors')
        .select('available_days')
        .eq('id', appointmentData.doctor_id)
        .single()

      if (doctorInfo?.available_days?.length) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const requestedDay = dayNames[new Date(appointmentData.appointment_date).getUTCDay()]
        if (!doctorInfo.available_days.map((d: string) => d.toLowerCase()).includes(requestedDay)) {
          throw new Error('Doctor is not available on this day')
        }
      }

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', appointmentData.doctor_id)
        .eq('appointment_date', appointmentData.appointment_date)
        .eq('appointment_time', appointmentData.appointment_time)
        .neq('status', 'cancelled')

      if (conflicts && conflicts.length > 0) {
        throw new Error('Time slot already booked')
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select(`
          *,
          doctors:doctor_id(
            users!doctors_user_id_fkey(full_name),
            specialty,
            consultation_fee
          )
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update appointment
  static async updateAppointment(appointmentId: string, updates: AppointmentUpdate) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Cancel appointment
  static async cancelAppointment(appointmentId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
        })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get available time slots for doctor
  static async getAvailableSlots(doctorId: string, date: string) {
    try {
      // Get doctor's working hours and existing appointments
      const [doctorData, appointmentsData] = await Promise.all([
        supabase
          .from('doctors')
          .select('available_hours, available_days')
          .eq('id', doctorId)
          .single(),
        supabase
          .from('appointments')
          .select('appointment_time, duration')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', date)
          .neq('status', 'cancelled')
      ])

      if (doctorData.error) throw doctorData.error

      const doctor = doctorData.data
      const appointments = appointmentsData.data || []

      // Check if doctor is available on this day of the week
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const requestedDay = dayNames[new Date(date).getUTCDay()]
      const availableDays: string[] = doctor.available_days || []
      if (availableDays.length > 0 && !availableDays.map((d: string) => d.toLowerCase()).includes(requestedDay)) {
        return { data: [], error: null } // Doctor not available on this day
      }

      // Parse working hours (e.g., "09:00-17:00")
      const [startTime, endTime] = doctor.available_hours.split('-')
      
      // Generate 30-minute slots
      const slots = []
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
      
      while (start < end) {
        const timeStr = start.toTimeString().slice(0, 5)
        
        // Check if slot is already booked
        const isBooked = appointments.some(apt => {
          const aptTime = new Date(`2000-01-01T${apt.appointment_time}`)
          const aptEnd = new Date(aptTime.getTime() + (apt.duration || 30) * 60000)
          const slotTime = new Date(`2000-01-01T${timeStr}`)
          const slotEnd = new Date(slotTime.getTime() + 30 * 60000)
          
          return (slotTime < aptEnd && slotEnd > aptTime)
        })
        
        if (!isBooked) {
          slots.push(timeStr)
        }
        
        start.setMinutes(start.getMinutes() + 30)
      }

      return { data: slots, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get appointment statistics
  static async getAppointmentStats(doctorId?: string, hospitalId?: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase.from('appointments').select('status, type, created_at')

      if (doctorId) query = query.eq('doctor_id', doctorId)
      if (hospitalId) query = query.eq('hospital_id', hospitalId)
      if (startDate) query = query.gte('appointment_date', startDate)
      if (endDate) query = query.lte('appointment_date', endDate)

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        completed: 0,
        cancelled: 0,
        revenue: 0
      }

      data?.forEach(appointment => {
        stats.byStatus[appointment.status] = (stats.byStatus[appointment.status] || 0) + 1
        stats.byType[appointment.type] = (stats.byType[appointment.type] || 0) + 1
        
        if (appointment.status === 'completed') stats.completed++
        if (appointment.status === 'cancelled') stats.cancelled++
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get upcoming appointments (next 7 days)
  static async getUpcomingAppointments(userId: string, userType: 'patient' | 'doctor') {
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      let query = supabase
        .from('appointments')
        .select(`
          *,
          ${userType === 'patient' ? 'doctors:doctor_id(users!doctors_user_id_fkey(full_name), specialty)' : 'patients:patient_id(full_name)'}
        `)
        .gte('appointment_date', today)
        .lte('appointment_date', nextWeek)
        .in('status', ['scheduled', 'confirmed'])

      if (userType === 'patient') {
        query = query.eq('patient_id', userId)
      } else {
        // For doctors, need to get doctor record first
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (doctorData) {
          query = query.eq('doctor_id', doctorData.id)
        }
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Start consultation timer
  static async startConsultation(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          actual_start_time: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // End consultation timer
  static async endConsultation(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          actual_end_time: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get time tracking analytics for a doctor
  static async getTimeTrackingAnalytics(doctorId: string) {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, patient_id, type, status, appointment_date, appointment_time, duration, actual_start_time, actual_end_time, fee, patients:patient_id(full_name)')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false })

      if (error) throw error

      const all = appointments || []
      const tracked = all.filter(a => a.actual_start_time && a.actual_end_time)

      const durations = tracked.map(a => {
        const start = new Date(a.actual_start_time!).getTime()
        const end = new Date(a.actual_end_time!).getTime()
        return { ...a, actualDuration: Math.round((end - start) / 60000) }
      })

      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d.actualDuration, 0) / durations.length)
        : 0

      // Average by type
      const avgByType: Record<string, number> = {}
      const typeGroups: Record<string, number[]> = {}
      durations.forEach(d => {
        if (!typeGroups[d.type]) typeGroups[d.type] = []
        typeGroups[d.type].push(d.actualDuration)
      })
      Object.entries(typeGroups).forEach(([type, vals]) => {
        avgByType[type] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      })

      // Hours by month
      const hoursByMonth: Record<string, number> = {}
      durations.forEach(d => {
        const month = d.appointment_date?.substring(0, 7)
        if (month) hoursByMonth[month] = (hoursByMonth[month] || 0) + d.actualDuration / 60
      })

      // Today's sessions
      const today = new Date().toISOString().split('T')[0]
      const todaySessions = durations.filter(d => d.appointment_date === today)
      const todayTotalMinutes = todaySessions.reduce((sum, d) => sum + d.actualDuration, 0)

      // Active consultation (started but not ended)
      const activeConsultation = all.find(a => a.actual_start_time && !a.actual_end_time)

      // Today's pending appointments (can be started)
      const todayPending = all.filter(a =>
        a.appointment_date === today &&
        !a.actual_start_time &&
        ['scheduled', 'confirmed'].includes(a.status)
      )

      return {
        data: {
          totalTrackedSessions: durations.length,
          avgDuration,
          avgByType,
          hoursByMonth,
          todaySessions,
          todayTotalMinutes,
          todayPending,
          activeConsultation,
          recentSessions: durations.slice(0, 20),
        },
        error: null,
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Send appointment reminders
  static async sendReminders() {
    try {
      // Get appointments for tomorrow
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id(full_name, email, phone),
          doctors:doctor_id(users!doctors_user_id_fkey(full_name))
        `)
        .eq('appointment_date', tomorrow)
        .eq('status', 'confirmed')

      if (error) throw error

      // Here you would integrate with your notification system
      // For now, return the appointments that need reminders
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}