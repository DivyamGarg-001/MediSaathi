import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userType = searchParams.get('type')
    const query = searchParams.get('q')

    switch (action) {
      case 'profile':
        const { data, error } = await UserService.getCurrentUser()
        if (error) throw error
        return NextResponse.json({ success: true, data })

      case 'search':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query parameter required' }, { status: 400 })
        }
        const searchResult = await UserService.searchUsers(query, userType || undefined)
        if (searchResult.error) throw searchResult.error
        return NextResponse.json({ success: true, data: searchResult.data })

      case 'by-type':
        if (!userType || !['patient', 'doctor', 'hospital'].includes(userType)) {
          return NextResponse.json({ success: false, error: 'Valid user type required' }, { status: 400 })
        }
        const typeResult = await UserService.getUsersByType(userType as 'patient' | 'doctor' | 'hospital')
        if (typeResult.error) throw typeResult.error
        return NextResponse.json({ success: true, data: typeResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('User API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userData } = body

    switch (action) {
      case 'signup':
        // Create auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Failed to create user')

        // Create user profile
        const profileData = {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type,
          phone: userData.phone || null,
          date_of_birth: userData.date_of_birth || null,
          gender: userData.gender || null,
          address: userData.address || null,
        }

        const { data: profile, error: profileError } = await UserService.createUserProfile(profileData)
        if (profileError) throw profileError

        return NextResponse.json({ 
          success: true, 
          data: { user: authData.user, profile },
          message: 'User created successfully' 
        })

      case 'signin':
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        })

        if (signInError) throw signInError

        // Get user profile
        const { data: userProfile } = await UserService.getCurrentUser()
        
        return NextResponse.json({ 
          success: true, 
          data: { user: signInData.user, profile: userProfile },
          message: 'Signed in successfully' 
        })

      case 'signout':
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError

        return NextResponse.json({ 
          success: true, 
          message: 'Signed out successfully' 
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('User Auth Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await UserService.updateUserProfile(userId, updates)
    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('User Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const { error } = await UserService.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })
  } catch (error) {
    console.error('User Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}