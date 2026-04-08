import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    if (action === 'unread-count') {
      const result = await NotificationService.getUnreadCount(userId)
      if (result.error) throw result.error
      return NextResponse.json({ success: true, data: result.data })
    }

    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const result = await NotificationService.getUserNotifications(userId, unreadOnly)
    if (result.error) throw result.error
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Notifications API Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationId, userId } = body

    switch (action) {
      case 'mark-read':
        if (!notificationId) {
          return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 })
        }
        const readResult = await NotificationService.markAsRead(notificationId)
        if (readResult.error) throw readResult.error
        return NextResponse.json({ success: true, data: readResult.data })

      case 'mark-all-read':
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }
        const allReadResult = await NotificationService.markAllAsRead(userId)
        if (allReadResult.error) throw allReadResult.error
        return NextResponse.json({ success: true, data: allReadResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notifications Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 })
  }
}
