import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type AiInsight = Database['public']['Tables']['ai_insights']['Row']
type AiInsightInsert = Database['public']['Tables']['ai_insights']['Insert']

export class ReminderService {
  // Get all active reminders for a user
  static async getUserReminders(userId: string, includeDismissed: boolean = false) {
    try {
      let query = supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)

      if (!includeDismissed) {
        query = query.eq('dismissed', false)
      }

      const { data, error } = await query
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter out expired insights
      const now = new Date().toISOString()
      const filtered = data?.filter(i => !i.expires_at || i.expires_at > now) || []

      return { data: filtered, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Dismiss a reminder
  static async dismissReminder(reminderId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .update({ dismissed: true })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create a reminder/insight
  static async createReminder(reminderData: AiInsightInsert) {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert(reminderData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Generate medication reminders from active prescriptions
  static async generateMedicationReminders(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get active prescriptions
      const { data: prescriptions, error: rxError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors:doctor_id ( users:user_id (full_name) )
        `)
        .eq('patient_id', userId)
        .eq('status', 'active')
        .gte('valid_until', today)

      if (rxError) throw rxError

      const reminders: AiInsightInsert[] = []

      for (const rx of prescriptions || []) {
        const meds = Array.isArray(rx.medications) ? rx.medications : []
        const daysUntilExpiry = Math.ceil(
          (new Date(rx.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        const doctorName = (rx.doctors as any)?.users?.full_name || 'your doctor'

        // Remind about each medication
        for (const med of meds) {
          reminders.push({
            user_id: userId,
            insight_type: 'medication_reminder',
            title: `Take ${med.name || 'medication'}`,
            description: `${med.dosage || ''} - ${med.frequency || ''}. Prescribed by Dr. ${doctorName}.${daysUntilExpiry <= 7 ? ` Prescription expires in ${daysUntilExpiry} days.` : ''}`,
            severity: daysUntilExpiry <= 3 ? 'high' : daysUntilExpiry <= 7 ? 'medium' : 'low',
            action_required: daysUntilExpiry <= 7,
            expires_at: rx.valid_until + 'T23:59:59Z',
          })
        }
      }

      // Clear existing medication reminders before inserting fresh ones
      await supabase
        .from('ai_insights')
        .delete()
        .eq('user_id', userId)
        .eq('insight_type', 'medication_reminder')

      if (reminders.length > 0) {
        const { error: insertError } = await supabase
          .from('ai_insights')
          .insert(reminders)

        if (insertError) throw insertError
      }

      return { data: reminders.length, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Generate checkup reminders based on appointments and vitals
  static async generateCheckupReminders(userId: string) {
    try {
      const reminders: AiInsightInsert[] = []

      // Check last appointment date
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_date, type')
        .eq('patient_id', userId)
        .in('status', ['completed', 'confirmed', 'scheduled'])
        .order('appointment_date', { ascending: false })
        .limit(1)

      const lastAppointment = appointments?.[0]
      if (lastAppointment) {
        const daysSinceLastAppt = Math.floor(
          (Date.now() - new Date(lastAppointment.appointment_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastAppt > 180) {
          reminders.push({
            user_id: userId,
            insight_type: 'checkup_due',
            title: 'Routine checkup overdue',
            description: `Your last appointment was ${daysSinceLastAppt} days ago. Consider scheduling a routine checkup.`,
            severity: daysSinceLastAppt > 365 ? 'high' : 'medium',
            action_required: true,
          })
        }
      } else {
        reminders.push({
          user_id: userId,
          insight_type: 'checkup_due',
          title: 'Schedule your first checkup',
          description: 'No previous appointments found. Schedule a routine health checkup with a doctor.',
          severity: 'medium',
          action_required: true,
        })
      }

      // Check vital sign gaps
      const vitalTypes = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight']
      for (const vitalType of vitalTypes) {
        const { data: vitals } = await supabase
          .from('vital_signs')
          .select('recorded_at')
          .eq('user_id', userId)
          .eq('type', vitalType)
          .order('recorded_at', { ascending: false })
          .limit(1)

        const lastVital = vitals?.[0]
        if (!lastVital) {
          reminders.push({
            user_id: userId,
            insight_type: 'health_trend',
            title: `Start tracking ${vitalType.replace(/_/g, ' ')}`,
            description: `No ${vitalType.replace(/_/g, ' ')} readings recorded yet. Regular tracking helps monitor your health.`,
            severity: 'low',
            action_required: false,
          })
        } else {
          const daysSince = Math.floor(
            (Date.now() - new Date(lastVital.recorded_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSince > 14) {
            reminders.push({
              user_id: userId,
              insight_type: 'health_trend',
              title: `Update ${vitalType.replace(/_/g, ' ')} reading`,
              description: `Last ${vitalType.replace(/_/g, ' ')} reading was ${daysSince} days ago. Keep your records up to date.`,
              severity: daysSince > 30 ? 'medium' : 'low',
              action_required: daysSince > 30,
            })
          }
        }
      }

      // Check upcoming appointments (within 3 days)
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const today = new Date().toISOString().split('T')[0]

      const { data: upcoming } = await supabase
        .from('appointments')
        .select(`
          appointment_date,
          appointment_time,
          type,
          reason,
          doctors:doctor_id ( users:user_id (full_name) )
        `)
        .eq('patient_id', userId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('appointment_date', today)
        .lte('appointment_date', threeDaysFromNow.toISOString().split('T')[0])

      for (const appt of upcoming || []) {
        const doctorName = (appt.doctors as any)?.users?.full_name || 'your doctor'
        const isToday = appt.appointment_date === today
        reminders.push({
          user_id: userId,
          insight_type: 'checkup_due',
          title: isToday ? 'Appointment today' : 'Upcoming appointment',
          description: `${appt.type} with Dr. ${doctorName} on ${new Date(appt.appointment_date).toLocaleDateString()} at ${appt.appointment_time}. Reason: ${appt.reason}`,
          severity: isToday ? 'high' : 'medium',
          action_required: true,
          expires_at: appt.appointment_date + 'T23:59:59Z',
        })
      }

      // Clear existing checkup/trend reminders and insert fresh ones
      await supabase
        .from('ai_insights')
        .delete()
        .eq('user_id', userId)
        .in('insight_type', ['checkup_due', 'health_trend'])

      if (reminders.length > 0) {
        const { error: insertError } = await supabase
          .from('ai_insights')
          .insert(reminders)

        if (insertError) throw insertError
      }

      return { data: reminders.length, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Generate all reminders at once
  static async generateAllReminders(userId: string) {
    try {
      const [medResult, checkupResult] = await Promise.all([
        this.generateMedicationReminders(userId),
        this.generateCheckupReminders(userId),
      ])

      if (medResult.error) throw medResult.error
      if (checkupResult.error) throw checkupResult.error

      // Return all reminders
      const result = await this.getUserReminders(userId)
      return result
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get reminder stats
  static async getReminderStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('insight_type, severity, action_required, dismissed')
        .eq('user_id', userId)
        .eq('dismissed', false)

      if (error) throw error

      const insights = data || []
      return {
        data: {
          total: insights.length,
          actionRequired: insights.filter(i => i.action_required).length,
          bySeverity: {
            critical: insights.filter(i => i.severity === 'critical').length,
            high: insights.filter(i => i.severity === 'high').length,
            medium: insights.filter(i => i.severity === 'medium').length,
            low: insights.filter(i => i.severity === 'low').length,
          },
          byType: {
            medication_reminder: insights.filter(i => i.insight_type === 'medication_reminder').length,
            checkup_due: insights.filter(i => i.insight_type === 'checkup_due').length,
            health_trend: insights.filter(i => i.insight_type === 'health_trend').length,
            risk_prediction: insights.filter(i => i.insight_type === 'risk_prediction').length,
          },
        },
        error: null,
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}
