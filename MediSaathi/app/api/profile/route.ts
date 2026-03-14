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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No valid session' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { user_type, full_name, specialty, license_number } = body

    if (!user_type) {
      return NextResponse.json({ 
        success: false, 
        error: 'User type is required' 
      }, { status: 400 })
    }

    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 })
    }

    // Update user profile
    const updateData: any = {
      user_type,
      updated_at: new Date().toISOString()
    }

    if (full_name) updateData.full_name = full_name
    if (specialty) updateData.specialty = specialty
    if (license_number) updateData.license_number = license_number

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('email', session.user.email)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update profile',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No valid session' 
      }, { status: 401 })
    }

    // Get user profile
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch profile',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}