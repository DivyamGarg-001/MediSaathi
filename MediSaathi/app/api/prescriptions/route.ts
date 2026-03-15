import { NextRequest, NextResponse } from 'next/server'
import { PrescriptionService } from '@/lib/services/prescription.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const prescriptionId = searchParams.get('prescriptionId')
    const query = searchParams.get('query')

    if (!userId && action !== 'get-by-id') {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'get-prescriptions':
        const prescriptionsResult = await PrescriptionService.getPatientPrescriptions(
          userId!,
          status || undefined
        )
        if (prescriptionsResult.error) throw prescriptionsResult.error
        return NextResponse.json({ success: true, data: prescriptionsResult.data })

      case 'get-active':
        const activeResult = await PrescriptionService.getActivePrescriptions(userId!)
        if (activeResult.error) throw activeResult.error
        return NextResponse.json({ success: true, data: activeResult.data })

      case 'get-expired':
        const expiredResult = await PrescriptionService.getExpiredPrescriptions(userId!)
        if (expiredResult.error) throw expiredResult.error
        return NextResponse.json({ success: true, data: expiredResult.data })

      case 'get-by-id':
        if (!prescriptionId) {
          return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 })
        }
        const singleResult = await PrescriptionService.getPrescription(prescriptionId)
        if (singleResult.error) throw singleResult.error
        return NextResponse.json({ success: true, data: singleResult.data })

      case 'stats':
        const statsResult = await PrescriptionService.getPrescriptionStats(userId!)
        if (statsResult.error) throw statsResult.error
        return NextResponse.json({ success: true, data: statsResult.data })

      case 'search':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Search query required' }, { status: 400 })
        }
        const searchResult = await PrescriptionService.searchPrescriptions(userId!, query)
        if (searchResult.error) throw searchResult.error
        return NextResponse.json({ success: true, data: searchResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Prescriptions API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prescriptionData } = body

    if (!prescriptionData.doctor_id || !prescriptionData.patient_id || !prescriptionData.medications || !prescriptionData.valid_until) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing (doctor_id, patient_id, medications, valid_until)'
      }, { status: 400 })
    }

    const result = await PrescriptionService.createPrescription(prescriptionData)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Prescription created successfully'
    })
  } catch (error) {
    console.error('Prescription Create Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create prescription' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { prescriptionId, updates } = body

    if (!prescriptionId) {
      return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 })
    }

    const result = await PrescriptionService.updatePrescription(prescriptionId, updates)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Prescription updated successfully'
    })
  } catch (error) {
    console.error('Prescription Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prescriptionId = searchParams.get('prescriptionId')

    if (!prescriptionId) {
      return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 })
    }

    const result = await PrescriptionService.cancelPrescription(prescriptionId)
    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Prescription cancelled successfully'
    })
  } catch (error) {
    console.error('Prescription Cancel Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel prescription' }, { status: 500 })
  }
}
