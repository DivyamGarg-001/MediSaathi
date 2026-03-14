import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { HealthRecordService } from '@/lib/services/health-record.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    switch (action) {
      case 'get-records':
        try {
          const { data: records, error } = await supabase
            .from('health_records')
            .select(`
              id,
              title,
              type,
              date_recorded,
              created_at,
              file_url
            `)
            .eq('user_id', userId)
            .order('date_recorded', { ascending: false })
            .limit(50)

          if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
              success: false, 
              error: 'Failed to fetch health records',
              details: error.message
            }, { status: 500 })
          }

          return NextResponse.json({ 
            success: true, 
            data: records || [] 
          })

        } catch (dbError) {
          console.error('Database connection error:', dbError)
          return NextResponse.json({ 
            success: false, 
            error: 'Database connection failed',
            details: dbError instanceof Error ? dbError.message : 'Unknown error'
          }, { status: 500 })
        }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Health records API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, type, file_url, date_recorded } = body

    if (!user_id || !title || !type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: user_id, title, type' 
      }, { status: 400 })
    }

    const { data: record, error } = await supabase
      .from('health_records')
      .insert({
        user_id,
        title,
        type,
        file_url: file_url || '',
        date_recorded: date_recorded || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create health record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: record 
    })

  } catch (error) {
    console.error('Health records POST API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, updates } = body

    if (!recordId) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 })
    }

    const result = await HealthRecordService.updateHealthRecord(recordId, updates)
    if (result.error) throw result.error

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Health record updated successfully' 
    })
  } catch (error) {
    console.error('Health Record Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update health record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 })
    }

    const { error } = await HealthRecordService.deleteHealthRecord(recordId)
    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Health record deleted successfully' 
    })
  } catch (error) {
    console.error('Health Record Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete health record' }, { status: 500 })
  }
}