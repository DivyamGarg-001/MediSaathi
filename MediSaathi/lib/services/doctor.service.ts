import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Doctor = Database['public']['Tables']['doctors']['Row']
type DoctorInsert = Database['public']['Tables']['doctors']['Insert']
type DoctorUpdate = Database['public']['Tables']['doctors']['Update']

export class DoctorService {
  // Get doctor profile by user ID
  static async getDoctorByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id(full_name, email, phone, avatar_url),
          hospitals:hospital_id(name, address)
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get doctor by ID
  static async getDoctor(doctorId: string) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id(full_name, email, phone, avatar_url),
          hospitals:hospital_id(name, address, phone)
        `)
        .eq('id', doctorId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create doctor profile
  static async createDoctor(doctorData: DoctorInsert) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert(doctorData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update doctor profile
  static async updateDoctor(doctorId: string, updates: DoctorUpdate) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search doctors
  static async searchDoctors(query?: string, specialty?: string, hospitalId?: string) {
    try {
      let queryBuilder = supabase
        .from('doctors')
        .select(`
          *,
          users:user_id(full_name, avatar_url),
          hospitals:hospital_id(name, address)
        `)

      if (query) {
        queryBuilder = queryBuilder.or(`
          users.full_name.ilike.%${query}%,
          specialty.ilike.%${query}%,
          bio.ilike.%${query}%
        `)
      }

      if (specialty) {
        queryBuilder = queryBuilder.eq('specialty', specialty)
      }

      if (hospitalId) {
        queryBuilder = queryBuilder.eq('hospital_id', hospitalId)
      }

      const { data, error } = await queryBuilder
        .order('rating', { ascending: false })
        .order('total_patients', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get doctors by hospital
  static async getDoctorsByHospital(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id(full_name, avatar_url, phone)
        `)
        .eq('hospital_id', hospitalId)
        .order('specialty')

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get doctor's patients
  static async getDoctorPatients(doctorId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          users:patient_id(full_name, avatar_url, phone, date_of_birth),
          appointment_date,
          status
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false })

      if (error) throw error

      // Remove duplicates and get unique patients
      const uniquePatients = data?.reduce((acc, appointment) => {
        const patientId = appointment.patient_id
        if (!acc.find(p => p.patient_id === patientId)) {
          acc.push(appointment)
        }
        return acc
      }, [] as any[])

      return { data: uniquePatients, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get doctor statistics
  static async getDoctorStats(doctorId: string) {
    try {
      const [appointmentsResult, prescriptionsResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('status, type, fee, created_at')
          .eq('doctor_id', doctorId),
        supabase
          .from('prescriptions')
          .select('created_at')
          .eq('doctor_id', doctorId)
      ])

      const appointments = appointmentsResult.data || []
      const prescriptions = prescriptionsResult.data || []

      const stats = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
        totalRevenue: appointments
          .filter(a => a.status === 'completed' && a.fee)
          .reduce((sum, a) => sum + (a.fee || 0), 0),
        totalPrescriptions: prescriptions.length,
        monthlyAppointments: {} as Record<string, number>,
        appointmentsByType: {} as Record<string, number>
      }

      // Calculate monthly appointments
      appointments.forEach(apt => {
        const month = new Date(apt.created_at).toISOString().substring(0, 7)
        stats.monthlyAppointments[month] = (stats.monthlyAppointments[month] || 0) + 1
        stats.appointmentsByType[apt.type] = (stats.appointmentsByType[apt.type] || 0) + 1
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update doctor rating
  static async updateDoctorRating(doctorId: string, newRating: number) {
    try {
      // Get current rating and patient count
      const { data: doctor } = await supabase
        .from('doctors')
        .select('rating, total_patients')
        .eq('id', doctorId)
        .single()

      if (!doctor) throw new Error('Doctor not found')

      // Calculate new average rating
      const currentTotal = doctor.rating * doctor.total_patients
      const newTotal = currentTotal + newRating
      const newPatientCount = doctor.total_patients + 1
      const newAverageRating = newTotal / newPatientCount

      const { data, error } = await supabase
        .from('doctors')
        .update({
          rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
          total_patients: newPatientCount
        })
        .eq('id', doctorId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get available specialties
  static async getSpecialties() {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('specialty')
        .order('specialty')

      if (error) throw error

      const specialties = [...new Set(data?.map(d => d.specialty))]
      return { data: specialties, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get top rated doctors
  static async getTopRatedDoctors(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          users:user_id(full_name, avatar_url),
          hospitals:hospital_id(name)
        `)
        .order('rating', { ascending: false })
        .order('total_patients', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check doctor availability
  static async isDoctorAvailable(doctorId: string, date: string, time: string) {
    try {
      // Check if doctor works on this day
      const { data: doctor } = await supabase
        .from('doctors')
        .select('available_days, available_hours')
        .eq('id', doctorId)
        .single()

      if (!doctor) return { available: false, error: 'Doctor not found' }

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      if (!doctor.available_days.includes(dayOfWeek)) {
        return { available: false, error: 'Doctor not available on this day' }
      }

      // Check if time is within working hours
      const [startTime, endTime] = doctor.available_hours.split('-')
      if (time < startTime || time > endTime) {
        return { available: false, error: 'Time outside working hours' }
      }

      // Check for existing appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .neq('status', 'cancelled')

      if (appointments && appointments.length > 0) {
        return { available: false, error: 'Time slot already booked' }
      }

      return { available: true, error: null }
    } catch (error) {
      return { available: false, error }
    }
  }
}