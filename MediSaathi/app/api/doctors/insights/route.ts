import { NextRequest, NextResponse } from 'next/server'
import { PracticeInsightService } from '@/lib/services/practice-insight.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
    }

    const result = await PracticeInsightService.getPracticeInsights(doctorId)
    if (result.error) throw result.error
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Practice Insights API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
