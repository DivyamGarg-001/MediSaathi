import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type FamilyMember = Database['public']['Tables']['family_members']['Row']
type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

export class FamilyMemberService {
  // Get all family members for current user
  static async getFamilyMembers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get single family member
  static async getFamilyMember(memberId: string) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Add new family member
  static async addFamilyMember(memberData: FamilyMemberInsert) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update family member
  static async updateFamilyMember(memberId: string, updates: FamilyMemberUpdate) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete family member
  static async deleteFamilyMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Get emergency contacts
  static async getEmergencyContacts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .eq('emergency_contact', true)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth: string): number {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
}