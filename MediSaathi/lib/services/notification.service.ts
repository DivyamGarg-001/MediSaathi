import { supabaseAdmin as supabase } from '@/lib/supabase'

export class NotificationService {
  // Create a notification
  static async createNotification(data: {
    user_id: string
    type: 'appointment_cancelled' | 'appointment_rescheduled' | 'appointment_booked' | 'prescription_created' | 'general'
    title: string
    message: string
    related_appointment_id?: string
  }) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return { data: notification, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return { data: count || 0, error: null }
    } catch (error) {
      return { data: 0, error }
    }
  }

  // Mark a notification as read
  static async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
