import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Prescription = Database['public']['Tables']['prescriptions']['Row']
type PrescriptionInsert = Database['public']['Tables']['prescriptions']['Insert']
type PrescriptionUpdate = Database['public']['Tables']['prescriptions']['Update']

export class PrescriptionService {
  // Get prescriptions for a patient
  static async getPatientPrescriptions(patientId: string, status?: string) {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialty,
            consultation_fee,
            users:user_id (full_name, avatar_url)
          ),
          appointments:appointment_id (
            appointment_date,
            appointment_time,
            type,
            reason
          )
        `)
        .eq('patient_id', patientId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get single prescription by ID
  static async getPrescription(prescriptionId: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialty,
            consultation_fee,
            users:user_id (full_name, avatar_url, phone)
          ),
          appointments:appointment_id (
            appointment_date,
            appointment_time,
            type,
            reason
          )
        `)
        .eq('id', prescriptionId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get active prescriptions for a patient
  static async getActivePrescriptions(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialty,
            users:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .order('valid_until', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get expired prescriptions for a patient
  static async getExpiredPrescriptions(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialty,
            users:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .or(`status.eq.expired,valid_until.lt.${new Date().toISOString().split('T')[0]}`)
        .order('valid_until', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create a prescription (used by doctors)
  static async createPrescription(prescriptionData: PrescriptionInsert) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update a prescription
  static async updatePrescription(prescriptionId: string, updates: PrescriptionUpdate) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update(updates)
        .eq('id', prescriptionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Cancel a prescription
  static async cancelPrescription(prescriptionId: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({ status: 'cancelled' })
        .eq('id', prescriptionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get prescription stats for a patient
  static async getPrescriptionStats(patientId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: all, error: allError } = await supabase
        .from('prescriptions')
        .select('id, status, valid_until')
        .eq('patient_id', patientId)

      if (allError) throw allError

      const total = all?.length || 0
      const active = all?.filter(p => p.status === 'active' && p.valid_until >= today).length || 0
      const expired = all?.filter(p => p.status === 'expired' || p.valid_until < today).length || 0
      const cancelled = all?.filter(p => p.status === 'cancelled').length || 0

      // Count total unique medications across active prescriptions
      const { data: activePrescriptions } = await supabase
        .from('prescriptions')
        .select('medications')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .gte('valid_until', today)

      const totalMedications = activePrescriptions?.reduce((sum, p) => {
        const meds = Array.isArray(p.medications) ? p.medications : []
        return sum + meds.length
      }, 0) || 0

      return {
        data: { total, active, expired, cancelled, totalMedications },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search prescriptions by medication name
  static async searchPrescriptions(patientId: string, query: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id (
            id,
            specialty,
            users:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .or(`instructions.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Also filter by medication name in JSONB
      const filtered = data?.filter(p => {
        const meds = Array.isArray(p.medications) ? p.medications : []
        return meds.some((m: any) =>
          m.name?.toLowerCase().includes(query.toLowerCase()) ||
          m.dosage?.toLowerCase().includes(query.toLowerCase())
        ) || p.instructions?.toLowerCase().includes(query.toLowerCase())
      })

      return { data: filtered, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
