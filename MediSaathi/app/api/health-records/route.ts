import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { HealthRecordService } from '@/lib/services/health-record.service'

const HEALTH_RECORD_TYPES = new Set([
  'lab_report',
  'prescription',
  'xray',
  'scan',
  'consultation',
  'other'
])

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

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
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const userId = String(formData.get('user_id') || '')
      const title = String(formData.get('title') || '').trim()
      const type = String(formData.get('type') || '').trim()
      const dateRecordedRaw = String(formData.get('date_recorded') || '').trim()
      const familyMemberIdRaw = String(formData.get('family_member_id') || '').trim()
      const content = String(formData.get('content') || '').trim()
      const isCritical = String(formData.get('is_critical') || 'false').toLowerCase() === 'true'
      const file = formData.get('file') as File | null

      if (!userId || !title || !type || !file) {
        return NextResponse.json({
          success: false,
          error: 'Missing required fields: user_id, title, type, file'
        }, { status: 400 })
      }

      if (!HEALTH_RECORD_TYPES.has(type)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid health record type'
        }, { status: 400 })
      }

      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        return NextResponse.json({
          success: false,
          error: 'Unsupported file type. Allowed: PDF, images, DOC, DOCX'
        }, { status: 400 })
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json({
          success: false,
          error: 'File is too large. Max allowed size is 10MB'
        }, { status: 400 })
      }

      const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateRecordedRaw)
        ? dateRecordedRaw
        : new Date().toISOString().slice(0, 10)

      const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : ''
      const fallbackExt = file.type === 'application/pdf'
        ? 'pdf'
        : file.type.includes('png')
          ? 'png'
          : file.type.includes('jpeg') || file.type.includes('jpg')
            ? 'jpg'
            : file.type.includes('webp')
              ? 'webp'
              : file.type === 'application/msword'
                ? 'doc'
                : 'docx'

      const fileExt = extension || fallbackExt
      const safeBaseName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .slice(0, 60)

      const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBaseName || 'record'}.${fileExt}`

      const fileArrayBuffer = await file.arrayBuffer()
      const { error: storageError } = await supabase.storage
        .from('patient_records')
        .upload(storagePath, Buffer.from(fileArrayBuffer), {
          contentType: file.type,
          upsert: false
        })

      if (storageError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to upload file to storage',
          details: storageError.message
        }, { status: 500 })
      }

      const { data: publicUrlData } = supabase.storage
        .from('patient_records')
        .getPublicUrl(storagePath)

      const { data: record, error: insertError } = await supabase
        .from('health_records')
        .insert({
          user_id: userId,
          family_member_id: familyMemberIdRaw || null,
          title,
          type,
          file_url: publicUrlData.publicUrl,
          file_type: file.type,
          content: content || null,
          date_recorded: normalizedDate,
          is_critical: isCritical
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage
          .from('patient_records')
          .remove([storagePath])

        return NextResponse.json({
          success: false,
          error: 'Failed to create health record',
          details: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: record
      })
    }

    const body = await request.json()
    const { user_id, title, type, file_url, date_recorded, file_type, content, family_member_id, is_critical } = body

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
        file_url: file_url || null,
        file_type: file_type || null,
        content: content || null,
        family_member_id: family_member_id || null,
        is_critical: Boolean(is_critical),
        date_recorded: date_recorded || new Date().toISOString().slice(0, 10)
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