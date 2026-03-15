import { NextRequest, NextResponse } from 'next/server'
import { HealthWalletService } from '@/lib/services/health-wallet.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const months = searchParams.get('months')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'get-transactions':
        const txResult = await HealthWalletService.getUserTransactions(
          userId,
          type || undefined,
          startDate || undefined,
          endDate || undefined
        )
        if (txResult.error) throw txResult.error
        return NextResponse.json({ success: true, data: txResult.data })

      case 'get-summary':
        const summaryResult = await HealthWalletService.getWalletSummary(
          userId,
          months ? parseInt(months) : 12
        )
        if (summaryResult.error) throw summaryResult.error
        return NextResponse.json({ success: true, data: summaryResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Health Wallet API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionData } = body

    if (!transactionData.user_id || !transactionData.transaction_type || !transactionData.category || !transactionData.amount || !transactionData.date_occurred) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing (user_id, transaction_type, category, amount, date_occurred)'
      }, { status: 400 })
    }

    const result = await HealthWalletService.addTransaction(transactionData)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Transaction added successfully'
    })
  } catch (error) {
    console.error('Health Wallet Add Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add transaction' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, updates } = body

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 })
    }

    const result = await HealthWalletService.updateTransaction(transactionId, updates)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Transaction updated successfully'
    })
  } catch (error) {
    console.error('Health Wallet Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 })
    }

    const { error } = await HealthWalletService.deleteTransaction(transactionId)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })
  } catch (error) {
    console.error('Health Wallet Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 500 })
  }
}
