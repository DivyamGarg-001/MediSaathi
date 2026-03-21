import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Hospital = Database['public']['Tables']['hospitals']['Row']
type HospitalInsert = Database['public']['Tables']['hospitals']['Insert']
type HospitalUpdate = Database['public']['Tables']['hospitals']['Update']
type DoctorInsert = Database['public']['Tables']['doctors']['Insert']
type DoctorUpdate = Database['public']['Tables']['doctors']['Update']

type HospitalDoctorCreateInput = {
  email: string
  password: string
  fullName: string
  phone?: string
  specialty: string
  licenseNumber: string
  experienceYears?: number
  education?: string
  consultationFee?: number
  availableDays?: string[]
  availableHours?: string
  bio?: string
}

type HospitalDoctorScheduleInput = {
  availableDays: string[]
  availableHours: string
}

type HospitalSystemSettingsInput = {
  name?: string
  address?: string
  phone?: string
  email?: string
  website?: string | null
  totalBeds?: number
  availableBeds?: number
  departments?: string[]
  services?: string[]
  emergencyServices?: boolean
}

type HospitalReportFilter = {
  fromDate?: string
  toDate?: string
}

export class HospitalService {
  // Get hospital by user ID
  static async getHospitalByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select(`
          *,
          users:user_id(full_name, email, phone, avatar_url)
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospital by ID
  static async getHospital(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create hospital profile
  static async createHospital(hospitalData: HospitalInsert) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert(hospitalData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update hospital profile
  static async updateHospital(hospitalId: string, updates: HospitalUpdate) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', hospitalId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search hospitals
  static async searchHospitals(query?: string, services?: string[], emergencyServices?: boolean) {
    try {
      let queryBuilder = supabase
        .from('hospitals')
        .select('*')

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%, address.ilike.%${query}%`)
      }

      if (services && services.length > 0) {
        queryBuilder = queryBuilder.overlaps('services', services)
      }

      if (emergencyServices !== undefined) {
        queryBuilder = queryBuilder.eq('emergency_services', emergencyServices)
      }

      const { data, error } = await queryBuilder
        .order('rating', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get all hospitals
  static async getAllHospitals() {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospital statistics
  static async getHospitalStats(hospitalId: string) {
    try {
      const [appointmentsResult, doctorsResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('status, type, fee, created_at')
          .eq('hospital_id', hospitalId),
        supabase
          .from('doctors')
          .select('id, specialty, rating, total_patients')
          .eq('hospital_id', hospitalId)
      ])

      const appointments = appointmentsResult.data || []
      const doctors = doctorsResult.data || []

      const stats = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        totalDoctors: doctors.length,
        totalRevenue: appointments
          .filter(a => a.status === 'completed' && a.fee)
          .reduce((sum, a) => sum + (a.fee || 0), 0),
        averageRating: doctors.length > 0 ? 
          doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length : 0,
        totalPatients: doctors.reduce((sum, d) => sum + d.total_patients, 0),
        departmentStats: {} as Record<string, number>,
        monthlyAppointments: {} as Record<string, number>
      }

      // Calculate department statistics
      doctors.forEach(doctor => {
        stats.departmentStats[doctor.specialty] = (stats.departmentStats[doctor.specialty] || 0) + 1
      })

      // Calculate monthly appointments
      appointments.forEach(apt => {
        const month = new Date(apt.created_at).toISOString().substring(0, 7)
        stats.monthlyAppointments[month] = (stats.monthlyAppointments[month] || 0) + 1
      })

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update bed availability
  static async updateBedAvailability(hospitalId: string, availableBeds: number) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update({ available_beds: availableBeds })
        .eq('id', hospitalId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospitals with available beds
  static async getHospitalsWithBeds(minimumBeds: number = 1) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .gte('available_beds', minimumBeds)
        .order('available_beds', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospitals by service
  static async getHospitalsByService(service: string) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .contains('services', [service])
        .order('rating', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get emergency hospitals nearby (mock location-based search)
  static async getEmergencyHospitals(userLocation?: { lat: number, lng: number }) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('emergency_services', true)
        .order('rating', { ascending: false })

      if (error) throw error

      // In a real implementation, you would calculate distance based on coordinates
      // For now, just return emergency hospitals ordered by rating
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospital departments
  static async getHospitalDepartments(hospitalId: string) {
    try {
      const { data: hospital, error } = await supabase
        .from('hospitals')
        .select('departments')
        .eq('id', hospitalId)
        .single()

      if (error) throw error

      // Get doctors count by department
      const { data: doctors } = await supabase
        .from('doctors')
        .select('specialty')
        .eq('hospital_id', hospitalId)

      const departmentStats = (hospital.departments ?? []).map((dept: string) => ({
        name: dept,
        doctorCount: doctors?.filter(d => d.specialty === dept).length || 0
      }))

      return { data: departmentStats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Add/Remove services
  static async updateHospitalServices(hospitalId: string, services: string[]) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update({ services })
        .eq('id', hospitalId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get top rated hospitals
  static async getTopRatedHospitals(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospital occupancy rate
  static async getHospitalOccupancy(hospitalId: string) {
    try {
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('total_beds, available_beds')
        .eq('id', hospitalId)
        .single()

      if (!hospital) throw new Error('Hospital not found')

      const occupiedBeds = hospital.total_beds - hospital.available_beds
      const occupancyRate = hospital.total_beds > 0 ? 
        (occupiedBeds / hospital.total_beds) * 100 : 0

      return { 
        data: {
          totalBeds: hospital.total_beds,
          availableBeds: hospital.available_beds,
          occupiedBeds,
          occupancyRate: Math.round(occupancyRate * 10) / 10
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create a doctor account and assign to hospital
  static async addDoctorToHospital(hospitalId: string, input: HospitalDoctorCreateInput) {
    try {
      const { data: hospital, error: hospitalError } = await supabase
        .from('hospitals')
        .select('id')
        .eq('id', hospitalId)
        .single()

      if (hospitalError || !hospital) {
        throw new Error('Hospital not found')
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .maybeSingle()

      if (existingUser) {
        throw new Error('A user with this email already exists')
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName,
          user_type: 'doctor',
        },
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create auth user for doctor')
      }

      const userId = authData.user.id

      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: input.email,
          full_name: input.fullName,
          user_type: 'doctor',
          phone: input.phone || null,
        })

      if (userInsertError) {
        await supabase.auth.admin.deleteUser(userId)
        throw userInsertError
      }

      const doctorInsert: DoctorInsert = {
        user_id: userId,
        hospital_id: hospitalId,
        specialty: input.specialty,
        license_number: input.licenseNumber,
        experience_years: input.experienceYears ?? 0,
        education: input.education || null,
        consultation_fee: input.consultationFee ?? null,
        available_days: input.availableDays ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours: input.availableHours ?? '09:00-17:00',
        bio: input.bio || null,
      }

      const { data: doctor, error: doctorInsertError } = await supabase
        .from('doctors')
        .insert(doctorInsert)
        .select('*, users:user_id(full_name, email, phone)')
        .single()

      if (doctorInsertError) {
        await supabase.from('users').delete().eq('id', userId)
        await supabase.auth.admin.deleteUser(userId)
        throw doctorInsertError
      }

      return { data: doctor, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Remove doctor from hospital and delete login/profile
  static async deleteDoctorFromHospital(hospitalId: string, doctorId: string) {
    try {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, user_id, hospital_id')
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .single()

      if (doctorError || !doctor) {
        throw new Error('Doctor not found in this hospital')
      }

      const { error: profileDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', doctor.user_id)

      if (profileDeleteError) {
        throw profileDeleteError
      }

      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(doctor.user_id)
      if (authDeleteError) {
        throw new Error(authDeleteError.message)
      }

      return { data: { doctorId }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update doctor's schedule by hospital admin
  static async updateDoctorSchedule(hospitalId: string, doctorId: string, input: HospitalDoctorScheduleInput) {
    try {
      const updates: DoctorUpdate = {
        available_days: input.availableDays,
        available_hours: input.availableHours,
      }

      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .select('*, users:user_id(full_name, email, phone)')
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Generate hospital report with doctor and appointment aggregates
  static async generateHospitalReport(hospitalId: string, filter?: HospitalReportFilter) {
    try {
      let appointmentQuery = supabase
        .from('appointments')
        .select('id, doctor_id, status, fee, type, appointment_date, created_at')
        .eq('hospital_id', hospitalId)

      if (filter?.fromDate) {
        appointmentQuery = appointmentQuery.gte('appointment_date', filter.fromDate)
      }

      if (filter?.toDate) {
        appointmentQuery = appointmentQuery.lte('appointment_date', filter.toDate)
      }

      const [appointmentsResult, doctorsResult] = await Promise.all([
        appointmentQuery,
        supabase
          .from('doctors')
          .select('id, specialty, rating, total_patients')
          .eq('hospital_id', hospitalId),
      ])

      if (appointmentsResult.error) throw appointmentsResult.error
      if (doctorsResult.error) throw doctorsResult.error

      const appointments = appointmentsResult.data || []
      const doctors = doctorsResult.data || []

      const doctorsById = new Map(doctors.map((doctor) => [doctor.id, doctor]))

      const appointmentsByStatus: Record<string, number> = {}
      const appointmentsByType: Record<string, number> = {}
      const appointmentsBySpecialty: Record<string, number> = {}
      const monthlyAppointments: Record<string, number> = {}
      const revenueByMonth: Record<string, number> = {}

      let totalRevenue = 0

      appointments.forEach((appointment) => {
        appointmentsByStatus[appointment.status] = (appointmentsByStatus[appointment.status] || 0) + 1
        appointmentsByType[appointment.type] = (appointmentsByType[appointment.type] || 0) + 1

        const specialty = doctorsById.get(appointment.doctor_id)?.specialty || 'unknown'
        appointmentsBySpecialty[specialty] = (appointmentsBySpecialty[specialty] || 0) + 1

        const month = appointment.appointment_date?.substring(0, 7)
        if (month) {
          monthlyAppointments[month] = (monthlyAppointments[month] || 0) + 1
        }

        if (appointment.status === 'completed') {
          totalRevenue += Number(appointment.fee || 0)
          if (month) {
            revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(appointment.fee || 0)
          }
        }
      })

      const averageDoctorRating = doctors.length
        ? Number((doctors.reduce((sum, doctor) => sum + Number(doctor.rating || 0), 0) / doctors.length).toFixed(2))
        : 0

      const report = {
        generatedAt: new Date().toISOString(),
        hospitalId,
        period: {
          fromDate: filter?.fromDate || null,
          toDate: filter?.toDate || null,
        },
        summary: {
          totalDoctors: doctors.length,
          totalAppointments: appointments.length,
          completedAppointments: appointmentsByStatus.completed || 0,
          cancelledAppointments: appointmentsByStatus.cancelled || 0,
          noShowAppointments: appointmentsByStatus.no_show || 0,
          totalRevenue,
          averageDoctorRating,
        },
        appointmentsByStatus,
        appointmentsByType,
        appointmentsBySpecialty,
        monthlyAppointments,
        revenueByMonth,
      }

      return { data: report, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get hospital settings editable by admins
  static async getHospitalSystemSettings(hospitalId: string) {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name, address, phone, email, website, total_beds, available_beds, departments, services, emergency_services')
        .eq('id', hospitalId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update hospital settings editable by admins
  static async updateHospitalSystemSettings(hospitalId: string, settings: HospitalSystemSettingsInput) {
    try {
      const updates: HospitalUpdate = {
        ...(settings.name !== undefined ? { name: settings.name } : {}),
        ...(settings.address !== undefined ? { address: settings.address } : {}),
        ...(settings.phone !== undefined ? { phone: settings.phone } : {}),
        ...(settings.email !== undefined ? { email: settings.email } : {}),
        ...(settings.website !== undefined ? { website: settings.website } : {}),
        ...(settings.totalBeds !== undefined ? { total_beds: settings.totalBeds } : {}),
        ...(settings.availableBeds !== undefined ? { available_beds: settings.availableBeds } : {}),
        ...(settings.departments !== undefined ? { departments: settings.departments } : {}),
        ...(settings.services !== undefined ? { services: settings.services } : {}),
        ...(settings.emergencyServices !== undefined ? { emergency_services: settings.emergencyServices } : {}),
      }

      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', hospitalId)
        .select('id, name, address, phone, email, website, total_beds, available_beds, departments, services, emergency_services')
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}