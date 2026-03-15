import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key — bypasses RLS, use only in server-side API routes
// Falls back to anon key on the client bundle (where SERVICE_ROLE_KEY is undefined) to prevent crash;
// the admin client is only actually invoked server-side where the real key is present.
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Database Types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: 'patient' | 'doctor' | 'hospital'
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type: 'patient' | 'doctor' | 'hospital'
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: 'patient' | 'doctor' | 'hospital'
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          user_id: string
          full_name: string
          relationship: string
          date_of_birth: string
          gender: string
          phone: string | null
          emergency_contact: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          relationship: string
          date_of_birth: string
          gender: string
          phone?: string | null
          emergency_contact?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          relationship?: string
          date_of_birth?: string
          gender?: string
          phone?: string | null
          emergency_contact?: boolean
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          user_id: string
          specialty: string
          license_number: string
          experience_years: number
          education: string | null
          hospital_id: string | null
          consultation_fee: number | null
          available_days: string[]
          available_hours: string
          bio: string | null
          rating: number
          total_patients: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialty: string
          license_number: string
          experience_years: number
          education?: string | null
          hospital_id?: string | null
          consultation_fee?: number | null
          available_days?: string[]
          available_hours?: string
          bio?: string | null
          rating?: number
          total_patients?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialty?: string
          license_number?: string
          experience_years?: number
          education?: string | null
          hospital_id?: string | null
          consultation_fee?: number | null
          available_days?: string[]
          available_hours?: string
          bio?: string | null
          rating?: number
          total_patients?: number
          updated_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          phone: string
          email: string
          website: string | null
          license_number: string
          total_beds: number
          available_beds: number
          departments: string[]
          services: string[]
          emergency_services: boolean
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          phone: string
          email: string
          website?: string | null
          license_number: string
          total_beds: number
          available_beds: number
          departments: string[]
          services: string[]
          emergency_services?: boolean
          rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          website?: string | null
          license_number?: string
          total_beds?: number
          available_beds?: number
          departments?: string[]
          services?: string[]
          emergency_services?: boolean
          rating?: number
          updated_at?: string
        }
      }
      health_records: {
        Row: {
          id: string
          user_id: string
          family_member_id: string | null
          title: string
          type: 'lab_report' | 'prescription' | 'xray' | 'scan' | 'consultation' | 'other'
          file_url: string | null
          file_type: string | null
          content: string | null
          doctor_id: string | null
          hospital_id: string | null
          date_recorded: string
          ai_summary: string | null
          tags: string[]
          is_critical: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          family_member_id?: string | null
          title: string
          type: 'lab_report' | 'prescription' | 'xray' | 'scan' | 'consultation' | 'other'
          file_url?: string | null
          file_type?: string | null
          content?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          date_recorded: string
          ai_summary?: string | null
          tags?: string[]
          is_critical?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          family_member_id?: string | null
          title?: string
          type?: 'lab_report' | 'prescription' | 'xray' | 'scan' | 'consultation' | 'other'
          file_url?: string | null
          file_type?: string | null
          content?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          date_recorded?: string
          ai_summary?: string | null
          tags?: string[]
          is_critical?: boolean
          updated_at?: string
        }
      }
      vital_signs: {
        Row: {
          id: string
          user_id: string
          family_member_id: string | null
          type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'blood_sugar' | 'oxygen_saturation'
          value: string
          unit: string
          notes: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          family_member_id?: string | null
          type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'blood_sugar' | 'oxygen_saturation'
          value: string
          unit: string
          notes?: string | null
          recorded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          family_member_id?: string | null
          type?: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'blood_sugar' | 'oxygen_saturation'
          value?: string
          unit?: string
          notes?: string | null
          recorded_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          hospital_id: string | null
          appointment_date: string
          appointment_time: string
          duration: number
          type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine'
          is_urgent: boolean
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          reason: string
          notes: string | null
          prescription_id: string | null
          fee: number | null
          payment_status: 'pending' | 'paid' | 'refunded'
          actual_start_time: string | null
          actual_end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          hospital_id?: string | null
          appointment_date: string
          appointment_time: string
          duration?: number
          type: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine'
          is_urgent?: boolean
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          reason: string
          notes?: string | null
          prescription_id?: string | null
          fee?: number | null
          payment_status?: 'pending' | 'paid' | 'refunded'
          actual_start_time?: string | null
          actual_end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          hospital_id?: string | null
          appointment_date?: string
          appointment_time?: string
          duration?: number
          type?: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine'
          is_urgent?: boolean
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          reason?: string
          notes?: string | null
          prescription_id?: string | null
          fee?: number | null
          payment_status?: 'pending' | 'paid' | 'refunded'
          actual_start_time?: string | null
          actual_end_time?: string | null
          updated_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          appointment_id: string | null
          medications: any[]
          instructions: string | null
          valid_until: string
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          appointment_id?: string | null
          medications: any[]
          instructions?: string | null
          valid_until: string
          status?: 'active' | 'expired' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          appointment_id?: string | null
          medications?: any[]
          instructions?: string | null
          valid_until?: string
          status?: 'active' | 'expired' | 'cancelled'
          updated_at?: string
        }
      }
      health_wallet: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'expense' | 'income' | 'insurance_claim'
          category: string
          amount: number
          description: string | null
          date_occurred: string
          doctor_id: string | null
          hospital_id: string | null
          appointment_id: string | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'expense' | 'income' | 'insurance_claim'
          category: string
          amount: number
          description?: string | null
          date_occurred: string
          doctor_id?: string | null
          hospital_id?: string | null
          appointment_id?: string | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          transaction_type?: 'expense' | 'income' | 'insurance_claim'
          category?: string
          amount?: number
          description?: string | null
          date_occurred?: string
          doctor_id?: string | null
          hospital_id?: string | null
          appointment_id?: string | null
          receipt_url?: string | null
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          family_member_id: string | null
          insight_type: 'risk_prediction' | 'health_trend' | 'medication_reminder' | 'checkup_due'
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          action_required: boolean
          dismissed: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_member_id?: string | null
          insight_type: 'risk_prediction' | 'health_trend' | 'medication_reminder' | 'checkup_due'
          title: string
          description: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          action_required?: boolean
          dismissed?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          dismissed?: boolean
          severity?: 'low' | 'medium' | 'high' | 'critical'
          action_required?: boolean
          expires_at?: string | null
        }
      }
    }
  }
}