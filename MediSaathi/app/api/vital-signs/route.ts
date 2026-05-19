import { NextRequest, NextResponse } from 'next/server'
import { VitalSignService } from '@/lib/services/vital-sign.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const familyMemberId = searchParams.get('familyMemberId')
    const type = searchParams.get('type')
    const days = searchParams.get('days')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'get-vitals':
        const vitalsResult = await VitalSignService.getVitalSigns(
          userId, 
          familyMemberId || undefined, 
          type || undefined
        )
        if (vitalsResult.error) throw vitalsResult.error
        return NextResponse.json({ success: true, data: vitalsResult.data })

      case 'latest-readings':
        const latestResult = await VitalSignService.getLatestReadings(
          userId, 
          familyMemberId || undefined
        )
        if (latestResult.error) throw latestResult.error
        return NextResponse.json({ success: true, data: latestResult.data })

      case 'analytics':
        if (!type) {
          return NextResponse.json({ success: false, error: 'Vital type required for analytics' }, { status: 400 })
        }
        const analyticsResult = await VitalSignService.getVitalAnalytics(
          userId,
          type,
          days ? parseInt(days) : 30,
          familyMemberId || undefined
        )
        if (analyticsResult.error) throw analyticsResult.error
        return NextResponse.json({ success: true, data: analyticsResult.data })

      case 'reminders':
        const remindersResult = await VitalSignService.getVitalReminders(userId)
        if (remindersResult.error) throw remindersResult.error
        return NextResponse.json({ success: true, data: remindersResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Vital Signs API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vitalData } = body

    if (!vitalData.user_id || !vitalData.type || !vitalData.value || !vitalData.unit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required vital sign data missing (user_id, type, value, unit)' 
      }, { status: 400 })
    }

    // Check for abnormal readings
    const abnormalCheck = VitalSignService.checkAbnormalReading(vitalData.type, vitalData.value)

    const result = await VitalSignService.addVitalSign({
      ...vitalData,
      recorded_at: vitalData.recorded_at || new Date().toISOString()
    })

    if (result.error) throw result.error

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      abnormal: abnormalCheck,
      message: 'Vital sign recorded successfully' 
    })
  } catch (error) {
    console.error('Vital Sign Recording Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record vital sign' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { vitalId, updates } = body

    if (!vitalId) {
      return NextResponse.json({ success: false, error: 'Vital sign ID required' }, { status: 400 })
    }

    const result = await VitalSignService.updateVitalSign(vitalId, updates)
    if (result.error) throw result.error

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Vital sign updated successfully' 
    })
  } catch (error) {
    console.error('Vital Sign Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update vital sign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vitalId = searchParams.get('vitalId')

    if (!vitalId) {
      return NextResponse.json({ success: false, error: 'Vital sign ID required' }, { status: 400 })
    }

    const { error } = await VitalSignService.deleteVitalSign(vitalId)
    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Vital sign deleted successfully' 
    })
  } catch (error) {
    console.error('Vital Sign Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete vital sign' }, { status: 500 })
  }
}