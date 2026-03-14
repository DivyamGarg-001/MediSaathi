import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type HealthRecord = Database['public']['Tables']['health_records']['Row']
type HealthRecordInsert = Database['public']['Tables']['health_records']['Insert']
type HealthRecordUpdate = Database['public']['Tables']['health_records']['Update']

export class HealthRecordService {
  // Get all health records for user
  static async getHealthRecords(userId: string, familyMemberId?: string) {
    try {
      let query = supabase
        .from('health_records')
        .select(`
          *,
          doctors:doctor_id(full_name, specialty),
          hospitals:hospital_id(name)
        `)
        .eq('user_id', userId)

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId)
      }

      const { data, error } = await query
        .order('date_recorded', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get single health record
  static async getHealthRecord(recordId: string) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          doctors:doctor_id(full_name, specialty),
          hospitals:hospital_id(name),
          family_members:family_member_id(full_name, relationship)
        `)
        .eq('id', recordId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Add new health record
  static async addHealthRecord(recordData: HealthRecordInsert) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert(recordData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update health record
  static async updateHealthRecord(recordId: string, updates: HealthRecordUpdate) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete health record
  static async deleteHealthRecord(recordId: string) {
    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Get records by type
  static async getRecordsByType(userId: string, type: string) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('date_recorded', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search records
  static async searchRecords(userId: string, query: string) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%, content.ilike.%${query}%, tags.cs.{${query}}`)
        .order('date_recorded', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get critical records
  static async getCriticalRecords(userId: string) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .eq('is_critical', true)
        .order('date_recorded', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Upload file to Supabase Storage
  static async uploadFile(file: File, userId: string): Promise<{url: string | null, error: any}> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('patient_records')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('patient_records')
        .getPublicUrl(fileName)

      return { url: publicUrl, error: null }
    } catch (error) {
      return { url: null, error }
    }
  }

  // Get analytics for records
  static async getRecordsAnalytics(userId: string) {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('type, created_at')
        .eq('user_id', userId)

      if (error) throw error

      // Process analytics data
      const analytics = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        byMonth: {} as Record<string, number>,
        recentCount: 0
      }

      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      data?.forEach(record => {
        // Count by type
        analytics.byType[record.type] = (analytics.byType[record.type] || 0) + 1
        
        // Count by month
        const month = new Date(record.created_at).toISOString().substring(0, 7)
        analytics.byMonth[month] = (analytics.byMonth[month] || 0) + 1
        
        // Count recent
        if (new Date(record.created_at) > lastMonth) {
          analytics.recentCount++
        }
      })

      return { data: analytics, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}