import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserService {
  // Get current user profile
  static async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create user profile after auth signup
  static async createUserProfile(userData: UserInsert) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: UserUpdate) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get users by type (for admin purposes)
  static async getUsersByType(userType: 'patient' | 'doctor' | 'hospital') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', userType)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search users
  static async searchUsers(query: string, userType?: string) {
    try {
      let queryBuilder = supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%, email.ilike.%${query}%`)

      if (userType) {
        queryBuilder = queryBuilder.eq('user_type', userType)
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete user account
  static async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}