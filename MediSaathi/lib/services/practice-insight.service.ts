import { supabaseAdmin as supabase } from '@/lib/supabase'

export class PracticeInsightService {
  static async getPracticeInsights(doctorId: string) {
    try {
      const [appointmentsResult, doctorResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, patient_id, status, type, fee, appointment_date, appointment_time, duration, actual_start_time, actual_end_time, created_at')
          .eq('doctor_id', doctorId),
        supabase
          .from('doctors')
          .select('available_days, available_hours, consultation_fee')
          .eq('id', doctorId)
          .single(),
      ])

      const appointments = appointmentsResult.data || []
      const doctor = doctorResult.data
      const completed = appointments.filter(a => a.status === 'completed')
      const cancelled = appointments.filter(a => a.status === 'cancelled')
      const noShow = appointments.filter(a => a.status === 'no_show')

      // KPIs
      const totalWithOutcome = completed.length + cancelled.length + noShow.length
      const completionRate = totalWithOutcome > 0 ? Math.round((completed.length / totalWithOutcome) * 100) : 0
      const cancellationRate = totalWithOutcome > 0 ? Math.round((cancelled.length / totalWithOutcome) * 100) : 0
      const noShowRate = totalWithOutcome > 0 ? Math.round((noShow.length / totalWithOutcome) * 100) : 0
      const avgRevenue = completed.length > 0
        ? Math.round(completed.reduce((sum, a) => sum + Number(a.fee || 0), 0) / completed.length)
        : 0

      // Patient retention (patients with >1 appointment)
      const patientVisits: Record<string, number> = {}
      appointments.forEach(a => { patientVisits[a.patient_id] = (patientVisits[a.patient_id] || 0) + 1 })
      const totalPatients = Object.keys(patientVisits).length
      const returningPatients = Object.values(patientVisits).filter(v => v > 1).length
      const retentionRate = totalPatients > 0 ? Math.round((returningPatients / totalPatients) * 100) : 0

      // Peak hours analysis
      const hourCounts: Record<string, number> = {}
      appointments.forEach(a => {
        if (a.appointment_time) {
          const hour = a.appointment_time.substring(0, 2)
          hourCounts[hour] = (hourCounts[hour] || 0) + 1
        }
      })

      // Day distribution
      const dayCounts: Record<string, number> = {}
      appointments.forEach(a => {
        if (a.appointment_date) {
          const day = new Date(a.appointment_date).toLocaleDateString('en-US', { weekday: 'long' })
          dayCounts[day] = (dayCounts[day] || 0) + 1
        }
      })

      // Schedule utilization
      let weeklyCapacity = 0
      if (doctor) {
        const [startTime, endTime] = (doctor.available_hours || '09:00-17:00').split('-')
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        const slotsPerDay = (endHour - startHour) * 2 // 30-min slots
        const daysPerWeek = (doctor.available_days || []).length || 5
        weeklyCapacity = slotsPerDay * daysPerWeek
      }

      // Average weekly bookings (last 12 weeks)
      const twelveWeeksAgo = new Date()
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
      const recentAppointments = appointments.filter(a =>
        a.appointment_date >= twelveWeeksAgo.toISOString().split('T')[0]
      )
      const weeklyBooked = recentAppointments.length > 0
        ? Math.round(recentAppointments.length / 12)
        : 0
      const utilizationRate = weeklyCapacity > 0
        ? Math.min(100, Math.round((weeklyBooked / weeklyCapacity) * 100))
        : 0

      // Revenue by month
      const revenueByMonth: Record<string, number> = {}
      completed.forEach(a => {
        const month = a.appointment_date?.substring(0, 7)
        if (month) revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(a.fee || 0)
      })

      // Type trends by month
      const typeByMonth: Record<string, Record<string, number>> = {}
      appointments.forEach(a => {
        const month = a.appointment_date?.substring(0, 7)
        if (month) {
          if (!typeByMonth[month]) typeByMonth[month] = {}
          typeByMonth[month][a.type] = (typeByMonth[month][a.type] || 0) + 1
        }
      })

      // Average consultation duration (from tracked sessions)
      const tracked = completed.filter(a => a.actual_start_time && a.actual_end_time)
      const avgConsultationMinutes = tracked.length > 0
        ? Math.round(tracked.reduce((sum, a) => {
            return sum + (new Date(a.actual_end_time!).getTime() - new Date(a.actual_start_time!).getTime()) / 60000
          }, 0) / tracked.length)
        : 0

      // Generate recommendations
      const recommendations: { text: string; type: 'success' | 'warning' | 'info' }[] = []

      if (cancellationRate > 15) {
        recommendations.push({ text: `High cancellation rate (${cancellationRate}%). Consider sending appointment reminders 24 hours before.`, type: 'warning' })
      }
      if (noShowRate > 10) {
        recommendations.push({ text: `No-show rate is ${noShowRate}%. Consider implementing confirmation calls.`, type: 'warning' })
      }
      if (retentionRate > 60) {
        recommendations.push({ text: `Great patient retention at ${retentionRate}%! Your patients keep coming back.`, type: 'success' })
      } else if (totalPatients > 5) {
        recommendations.push({ text: `Patient retention is ${retentionRate}%. Consider follow-up calls to improve return visits.`, type: 'info' })
      }
      if (utilizationRate > 85) {
        recommendations.push({ text: `Schedule is ${utilizationRate}% utilized. Consider extending hours or adding days.`, type: 'info' })
      } else if (utilizationRate < 40 && totalPatients > 0) {
        recommendations.push({ text: `Schedule utilization is ${utilizationRate}%. Consider adjusting availability to peak demand hours.`, type: 'info' })
      }

      const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]
      if (peakHour) {
        recommendations.push({ text: `Peak hour is ${peakHour[0]}:00 with ${peakHour[1]} appointments. Ensure adequate preparation for this slot.`, type: 'info' })
      }

      if (completionRate > 90) {
        recommendations.push({ text: `Excellent completion rate of ${completionRate}%! Keep up the great work.`, type: 'success' })
      }

      return {
        data: {
          kpis: { completionRate, cancellationRate, noShowRate, avgRevenue, retentionRate, avgConsultationMinutes },
          peakHours: hourCounts,
          dayDistribution: dayCounts,
          scheduleUtilization: { weeklyCapacity, weeklyBooked, utilizationRate },
          revenueByMonth,
          typeByMonth,
          recommendations,
        },
        error: null,
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}
