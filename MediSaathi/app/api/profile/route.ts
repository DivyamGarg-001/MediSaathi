import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

// NextAuth configuration for server-side session
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user?.email) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single()

        if (userData) {
          session.user.userType = userData.user_type
          session.user.userId = userData.id
          session.user.fullName = userData.full_name
        }
      }
      return session
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.userId = user.id
        token.email = user.email
      }
      return token
    }
  },
  session: {
    strategy: 'jwt' as const,
  },
}

async function ensureDoctorProfile(userId: string, specialty?: string, licenseNumber?: string) {
  const { data: existingDoctor, error: existingDoctorError } = await supabaseAdmin
    .from('doctors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingDoctorError) throw existingDoctorError
  if (existingDoctor) return

  const generatedLicense = licenseNumber || `DOC-${userId.slice(0, 8).toUpperCase()}`

  const { error: insertDoctorError } = await supabaseAdmin
    .from('doctors')
    .insert({
      user_id: userId,
      specialty: specialty || 'General Medicine',
      license_number: generatedLicense,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      available_hours: '09:00-17:00',
    })

  if (insertDoctorError) throw insertDoctorError
}

async function ensureHospitalProfile(
  userId: string,
  email: string,
  fullName?: string,
  phone?: string,
  licenseNumber?: string
) {
  const { data: existingHospital, error: existingHospitalError } = await supabaseAdmin
    .from('hospitals')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingHospitalError) throw existingHospitalError
  if (existingHospital) return

  const generatedLicense = licenseNumber || `HOSP-${userId.slice(0, 8).toUpperCase()}`

  const { error: insertHospitalError } = await supabaseAdmin
    .from('hospitals')
    .insert({
      user_id: userId,
      name: fullName || 'Hospital',
      address: 'Address not provided',
      phone: phone || 'Not provided',
      email,
      license_number: generatedLicense,
      total_beds: 0,
      available_beds: 0,
      departments: [],
      services: [],
      emergency_services: true,
    })

  if (insertHospitalError) throw insertHospitalError
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      user_type,
      full_name,
      specialty,
      license_number,
      phone,
      date_of_birth,
      gender,
      address,
      avatar_url,
      userId: bodyUserId,
    } = body

    // Resolve user: prefer NextAuth session (Google OAuth), fall back to body userId (email/password users)
    let existingUser: any = null
    if (session?.user?.email) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single()
      if (error || !data) {
        return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 })
      }
      existingUser = data
    } else if (bodyUserId) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', bodyUserId)
        .single()
      if (error || !data) {
        return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 })
      }
      existingUser = data
    } else {
      return NextResponse.json({ success: false, error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    // Build partial update — only include fields that were sent
    const updateData: any = {}
    if (user_type !== undefined) updateData.user_type = user_type
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (gender !== undefined) updateData.gender = gender || null
    if (address !== undefined) updateData.address = address
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', existingUser.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
        details: error.message,
      }, { status: 500 })
    }

    // Ensure role-specific profile only when user_type was explicitly set (existing updateUserType flow)
    if (user_type === 'doctor') {
      await ensureDoctorProfile(existingUser.id, specialty, license_number)
    }
    if (user_type === 'hospital') {
      await ensureHospitalProfile(
        existingUser.id,
        existingUser.email,
        full_name || existingUser.full_name || undefined,
        existingUser.phone || undefined,
        license_number
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')

    let query = supabaseAdmin.from('users').select('*')
    if (session?.user?.email) {
      query = query.eq('email', session.user.email)
    } else if (queryUserId) {
      query = query.eq('id', queryUserId)
    } else {
      return NextResponse.json({ success: false, error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profile',
        details: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}