import { NextRequest, NextResponse } from 'next/server'
import { EmergencyService } from '@/lib/services/emergency.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const result = await EmergencyService.getEmergencySnapshot(userId)
    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Emergency SOS API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load emergency SOS data'
    }, { status: 500 })
  }
}
