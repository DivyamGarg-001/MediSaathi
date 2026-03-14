import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type FamilyMember = Database['public']['Tables']['family_members']['Row']
type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert']
type FamilyMemberUpdate = Database['public']['Tables']['family_members']['Update']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const memberId = searchParams.get('memberId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    if (memberId) {
      // Get specific family member
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    } else {
      // Get all family members for user
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error('Family Members API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberData }: { memberData: FamilyMemberInsert } = body

    if (!memberData.user_id || !memberData.full_name || !memberData.relationship || !memberData.date_of_birth || !memberData.gender) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required family member data missing (user_id, full_name, relationship, date_of_birth, gender)' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert(memberData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Family member added successfully' 
    })
  } catch (error) {
    console.error('Family Member Creation Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add family member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, updates }: { memberId: string, updates: FamilyMemberUpdate } = body

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Family member updated successfully' 
    })
  } catch (error) {
    console.error('Family Member Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update family member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Family member deleted successfully' 
    })
  } catch (error) {
    console.error('Family Member Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete family member' }, { status: 500 })
  }
}