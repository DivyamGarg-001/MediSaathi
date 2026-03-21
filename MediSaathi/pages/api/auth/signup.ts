import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, full_name, user_type, phone, specialty, license_number, address, website } = req.body

  if (!email || !password || !full_name || !user_type) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if ((user_type === 'doctor' || user_type === 'hospital') && !license_number) {
    return res.status(400).json({ error: 'License number is required for doctor and hospital accounts' })
  }

  if (user_type === 'doctor' && !specialty) {
    return res.status(400).json({ error: 'Specialty is required for doctor accounts' })
  }

  if (user_type === 'hospital' && !address) {
    return res.status(400).json({ error: 'Address is required for hospital accounts' })
  }

  try {
    // Step 1: Check if email already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' })
    }

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so user can sign in immediately
      user_metadata: {
        full_name,
        user_type,
      }
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' })
      }
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Failed to create account' })
    }

    // Step 3: Insert profile using service role (bypasses RLS)
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      user_type,
      phone: phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (dbError) {
      // Clean up: delete the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: dbError.message })
    }

    // Step 4: Create role-specific profile
    if (user_type === 'doctor') {
      const { error: doctorError } = await supabaseAdmin
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          specialty,
          license_number,
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          available_hours: '09:00-17:00',
        })

      if (doctorError) {
        await supabaseAdmin.from('users').delete().eq('id', authData.user.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return res.status(500).json({ error: doctorError.message })
      }
    }

    if (user_type === 'hospital') {
      const { error: hospitalError } = await supabaseAdmin
        .from('hospitals')
        .insert({
          user_id: authData.user.id,
          name: full_name,
          address,
          phone: phone || 'Not provided',
          email,
          website: website || null,
          license_number,
          total_beds: 0,
          available_beds: 0,
          departments: [],
          services: [],
          emergency_services: true,
        })

      if (hospitalError) {
        await supabaseAdmin.from('users').delete().eq('id', authData.user.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return res.status(500).json({ error: hospitalError.message })
      }
    }

    return res.status(200).json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
