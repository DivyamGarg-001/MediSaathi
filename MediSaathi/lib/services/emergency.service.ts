import { supabaseAdmin as supabase } from '@/lib/supabase'

export class EmergencyService {
  static async getEmergencySnapshot(userId: string) {
    try {
      const [
        userProfileResult,
        emergencyContactsResult,
        criticalRecordsResult,
        latestVitalsResult,
        emergencyHospitalsResult
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, phone, date_of_birth, gender, address, email')
          .eq('id', userId)
          .single(),
        supabase
          .from('family_members')
          .select('id, full_name, relationship, phone, date_of_birth, gender, emergency_contact')
          .eq('user_id', userId)
          .eq('emergency_contact', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('health_records')
          .select('id, title, type, file_url, file_type, date_recorded, is_critical, content, created_at')
          .eq('user_id', userId)
          .eq('is_critical', true)
          .order('date_recorded', { ascending: false })
          .limit(10),
        supabase
          .from('vital_signs')
          .select('id, type, value, unit, notes, recorded_at')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(20),
        supabase
          .from('hospitals')
          .select('id, name, phone, address, emergency_services, rating')
          .eq('emergency_services', true)
          .order('rating', { ascending: false })
          .limit(5)
      ])

      if (userProfileResult.error) throw userProfileResult.error
      if (emergencyContactsResult.error) throw emergencyContactsResult.error
      if (criticalRecordsResult.error) throw criticalRecordsResult.error
      if (latestVitalsResult.error) throw latestVitalsResult.error
      if (emergencyHospitalsResult.error) throw emergencyHospitalsResult.error

      // Keep only the most recent value for each vital type.
      const vitalsByType = new Map<string, {
        id: string
        type: string
        value: string
        unit: string
        notes: string | null
        recorded_at: string
      }>()

      for (const vital of latestVitalsResult.data || []) {
        if (!vitalsByType.has(vital.type)) {
          vitalsByType.set(vital.type, vital)
        }
      }

      return {
        data: {
          userProfile: userProfileResult.data,
          emergencyContacts: emergencyContactsResult.data || [],
          criticalHealthRecords: criticalRecordsResult.data || [],
          latestVitals: Array.from(vitalsByType.values()).slice(0, 6),
          emergencyHospitals: emergencyHospitalsResult.data || [],
          generatedAt: new Date().toISOString()
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}
