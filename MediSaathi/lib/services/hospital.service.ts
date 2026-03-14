import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Hospital = Database['public']['Tables']['hospitals']['Row']
type HospitalInsert = Database['public']['Tables']['hospitals']['Insert']
type HospitalUpdate = Database['public']['Tables']['hospitals']['Update']

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
}