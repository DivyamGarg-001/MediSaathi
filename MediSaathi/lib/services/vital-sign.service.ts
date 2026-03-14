import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type VitalSign = Database['public']['Tables']['vital_signs']['Row']
type VitalSignInsert = Database['public']['Tables']['vital_signs']['Insert']
type VitalSignUpdate = Database['public']['Tables']['vital_signs']['Update']

export class VitalSignService {
  // Get vital signs for user/family member
  static async getVitalSigns(userId: string, familyMemberId?: string, type?: string) {
    try {
      let query = supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', userId)

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId)
      }

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query
        .order('recorded_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Add vital sign reading
  static async addVitalSign(vitalData: VitalSignInsert) {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .insert(vitalData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update vital sign reading
  static async updateVitalSign(vitalId: string, updates: VitalSignUpdate) {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .update(updates)
        .eq('id', vitalId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete vital sign reading
  static async deleteVitalSign(vitalId: string) {
    try {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', vitalId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Get latest readings for all vital types
  static async getLatestReadings(userId: string, familyMemberId?: string) {
    try {
      const vitalTypes = [
        'blood_pressure', 'heart_rate', 'temperature', 
        'weight', 'height', 'blood_sugar', 'oxygen_saturation'
      ]

      const latestReadings = await Promise.all(
        vitalTypes.map(async (type) => {
          let query = supabase
            .from('vital_signs')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)

          if (familyMemberId) {
            query = query.eq('family_member_id', familyMemberId)
          }

          const { data, error } = await query
            .order('recorded_at', { ascending: false })
            .limit(1)

          return { type, data: data?.[0] || null, error }
        })
      )

      return { data: latestReadings, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get vital signs analytics
  static async getVitalAnalytics(userId: string, type: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true })

      if (error) throw error

      // Calculate analytics
      const analytics = {
        readings: data || [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable' as 'up' | 'down' | 'stable'
      }

      if (data && data.length > 0) {
        const numericValues = data
          .map(reading => parseFloat(reading.value.split('/')[0])) // Handle BP format
          .filter(val => !isNaN(val))

        if (numericValues.length > 0) {
          analytics.average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
          analytics.min = Math.min(...numericValues)
          analytics.max = Math.max(...numericValues)

          // Simple trend calculation
          if (numericValues.length > 1) {
            const recent = numericValues.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, numericValues.length)
            const older = numericValues.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(1, numericValues.length - 5)
            
            if (recent > older * 1.05) analytics.trend = 'up'
            else if (recent < older * 0.95) analytics.trend = 'down'
          }
        }
      }

      return { data: analytics, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check for abnormal readings
  static checkAbnormalReading(type: string, value: string): { isAbnormal: boolean, severity: 'low' | 'medium' | 'high', message?: string } {
    const numericValue = parseFloat(value.split('/')[0])
    
    switch (type) {
      case 'blood_pressure':
        const [systolic, diastolic] = value.split('/').map(v => parseFloat(v))
        if (systolic > 180 || diastolic > 120) {
          return { isAbnormal: true, severity: 'high', message: 'Hypertensive crisis - seek immediate medical attention' }
        } else if (systolic > 140 || diastolic > 90) {
          return { isAbnormal: true, severity: 'medium', message: 'High blood pressure - consult your doctor' }
        } else if (systolic < 90 || diastolic < 60) {
          return { isAbnormal: true, severity: 'medium', message: 'Low blood pressure - monitor closely' }
        }
        break

      case 'heart_rate':
        if (numericValue > 100) {
          return { isAbnormal: true, severity: 'medium', message: 'Elevated heart rate - consider rest' }
        } else if (numericValue < 60) {
          return { isAbnormal: true, severity: 'low', message: 'Low heart rate - monitor if symptomatic' }
        }
        break

      case 'temperature':
        if (numericValue > 100.4) {
          return { isAbnormal: true, severity: 'medium', message: 'Fever detected - monitor and consider medical advice' }
        } else if (numericValue < 95) {
          return { isAbnormal: true, severity: 'high', message: 'Low body temperature - seek medical attention' }
        }
        break

      case 'blood_sugar':
        if (numericValue > 200) {
          return { isAbnormal: true, severity: 'high', message: 'High blood sugar - check with healthcare provider' }
        } else if (numericValue < 70) {
          return { isAbnormal: true, severity: 'medium', message: 'Low blood sugar - consume glucose' }
        }
        break

      case 'oxygen_saturation':
        if (numericValue < 95) {
          return { isAbnormal: true, severity: 'high', message: 'Low oxygen saturation - seek immediate medical attention' }
        }
        break
    }

    return { isAbnormal: false, severity: 'low' }
  }

  // Get vital signs reminders
  static async getVitalReminders(userId: string) {
    try {
      // Check when last readings were taken for each vital type
      const vitalTypes = ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'blood_sugar']
      const reminders = []

      for (const type of vitalTypes) {
        const { data } = await this.getVitalSigns(userId, undefined, type)
        
        if (!data || data.length === 0) {
          reminders.push({
            type,
            message: `No ${type.replace('_', ' ')} readings recorded`,
            priority: 'low'
          })
        } else {
          const lastReading = new Date(data[0].recorded_at)
          const daysSinceLastReading = Math.floor((Date.now() - lastReading.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceLastReading > 7) {
            reminders.push({
              type,
              message: `Last ${type.replace('_', ' ')} reading was ${daysSinceLastReading} days ago`,
              priority: daysSinceLastReading > 30 ? 'high' : 'medium'
            })
          }
        }
      }

      return { data: reminders, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}