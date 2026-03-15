import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/lib/services/reminder.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const includeDismissed = searchParams.get('includeDismissed') === 'true'

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'get-reminders':
        const remindersResult = await ReminderService.getUserReminders(userId, includeDismissed)
        if (remindersResult.error) throw remindersResult.error
        return NextResponse.json({ success: true, data: remindersResult.data })

      case 'generate-all':
        const generateResult = await ReminderService.generateAllReminders(userId)
        if (generateResult.error) throw generateResult.error
        return NextResponse.json({ success: true, data: generateResult.data })

      case 'stats':
        const statsResult = await ReminderService.getReminderStats(userId)
        if (statsResult.error) throw statsResult.error
        return NextResponse.json({ success: true, data: statsResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Reminders API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminderData } = body

    if (!reminderData.user_id || !reminderData.insight_type || !reminderData.title || !reminderData.description) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing (user_id, insight_type, title, description)'
      }, { status: 400 })
    }

    const result = await ReminderService.createReminder(reminderData)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Reminder created successfully'
    })
  } catch (error) {
    console.error('Reminder Create Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create reminder' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminderId, action } = body

    if (!reminderId) {
      return NextResponse.json({ success: false, error: 'Reminder ID required' }, { status: 400 })
    }

    if (action === 'dismiss') {
      const result = await ReminderService.dismissReminder(reminderId)
      if (result.error) throw result.error
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Reminder dismissed'
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Reminder Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update reminder' }, { status: 500 })
  }
}
