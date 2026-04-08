import { NextRequest, NextResponse } from 'next/server'
import { HospitalService } from '@/lib/services/hospital.service'
import { DoctorService } from '@/lib/services/doctor.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const hospitalId = searchParams.get('hospitalId')
    const query = searchParams.get('q')
    const services = searchParams.get('services')?.split(',')
    const emergencyServices = searchParams.get('emergencyServices')
    const minimumBeds = searchParams.get('minimumBeds')
    const service = searchParams.get('service')
    const limit = searchParams.get('limit')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    switch (action) {
      case 'get-by-user':
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }
        const userResult = await HospitalService.getHospitalByUserId(userId)
        if (userResult.error) throw userResult.error
        return NextResponse.json({ success: true, data: userResult.data })

      case 'get-hospital':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const hospitalResult = await HospitalService.getHospital(hospitalId)
        if (hospitalResult.error) throw hospitalResult.error
        return NextResponse.json({ success: true, data: hospitalResult.data })

      case 'search':
        const searchResult = await HospitalService.searchHospitals(
          query || undefined,
          services,
          emergencyServices ? emergencyServices === 'true' : undefined
        )
        if (searchResult.error) throw searchResult.error
        return NextResponse.json({ success: true, data: searchResult.data })

      case 'all':
        const allResult = await HospitalService.getAllHospitals()
        if (allResult.error) throw allResult.error
        return NextResponse.json({ success: true, data: allResult.data })

      case 'stats':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const statsResult = await HospitalService.getHospitalStats(hospitalId)
        if (statsResult.error) throw statsResult.error
        return NextResponse.json({ success: true, data: statsResult.data })

      case 'with-beds':
        const bedsResult = await HospitalService.getHospitalsWithBeds(
          minimumBeds ? parseInt(minimumBeds) : 1
        )
        if (bedsResult.error) throw bedsResult.error
        return NextResponse.json({ success: true, data: bedsResult.data })

      case 'by-service':
        if (!service) {
          return NextResponse.json({ success: false, error: 'Service required' }, { status: 400 })
        }
        const serviceResult = await HospitalService.getHospitalsByService(service)
        if (serviceResult.error) throw serviceResult.error
        return NextResponse.json({ success: true, data: serviceResult.data })

      case 'emergency':
        const emergencyResult = await HospitalService.getEmergencyHospitals()
        if (emergencyResult.error) throw emergencyResult.error
        return NextResponse.json({ success: true, data: emergencyResult.data })

      case 'departments':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const deptResult = await HospitalService.getHospitalDepartments(hospitalId)
        if (deptResult.error) throw deptResult.error
        return NextResponse.json({ success: true, data: deptResult.data })

      case 'top-rated':
        const topResult = await HospitalService.getTopRatedHospitals(limit ? parseInt(limit) : 10)
        if (topResult.error) throw topResult.error
        return NextResponse.json({ success: true, data: topResult.data })

      case 'occupancy':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const occupancyResult = await HospitalService.getHospitalOccupancy(hospitalId)
        if (occupancyResult.error) throw occupancyResult.error
        return NextResponse.json({ success: true, data: occupancyResult.data })

      case 'settings':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const settingsResult = await HospitalService.getHospitalSystemSettings(hospitalId)
        if (settingsResult.error) throw settingsResult.error
        return NextResponse.json({ success: true, data: settingsResult.data })

      case 'report':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const reportResult = await HospitalService.generateHospitalReport(hospitalId, {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        })
        if (reportResult.error) throw reportResult.error
        return NextResponse.json({ success: true, data: reportResult.data })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Hospitals API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, hospitalData, hospitalId, doctorData } = body

    switch (action) {
      case 'create':
        if (!hospitalData.user_id || !hospitalData.name || !hospitalData.address || !hospitalData.phone || !hospitalData.email || !hospitalData.license_number) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required hospital data missing (user_id, name, address, phone, email, license_number)' 
          }, { status: 400 })
        }

        const result = await HospitalService.createHospital(hospitalData)
        if (result.error) throw result.error

        return NextResponse.json({ 
          success: true, 
          data: result.data,
          message: 'Hospital profile created successfully' 
        })

      case 'add-doctor':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }

        if (!doctorData?.email || !doctorData?.password || !doctorData?.fullName || !doctorData?.specialty || !doctorData?.licenseNumber) {
          return NextResponse.json({
            success: false,
            error: 'Required doctor fields missing (email, password, fullName, specialty, licenseNumber)',
          }, { status: 400 })
        }

        const addDoctorResult = await HospitalService.addDoctorToHospital(hospitalId, doctorData)
        if (addDoctorResult.error) throw addDoctorResult.error

        return NextResponse.json({
          success: true,
          data: addDoctorResult.data,
          message: 'Doctor created and assigned successfully',
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Hospital Creation Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create hospital profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, hospitalId, updates, availableBeds, services, doctorId, schedule, settings, doctorUpdates } = body

    if (!hospitalId) {
      return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
    }

    switch (action) {
      case 'update':
        const updateResult = await HospitalService.updateHospital(hospitalId, updates)
        if (updateResult.error) throw updateResult.error

        return NextResponse.json({ 
          success: true, 
          data: updateResult.data,
          message: 'Hospital profile updated successfully' 
        })

      case 'update-beds':
        if (availableBeds === undefined || availableBeds < 0) {
          return NextResponse.json({ success: false, error: 'Valid available beds count required' }, { status: 400 })
        }

        const bedsResult = await HospitalService.updateBedAvailability(hospitalId, availableBeds)
        if (bedsResult.error) throw bedsResult.error

        return NextResponse.json({ 
          success: true, 
          data: bedsResult.data,
          message: 'Bed availability updated successfully' 
        })

      case 'update-services':
        if (!services || !Array.isArray(services)) {
          return NextResponse.json({ success: false, error: 'Valid services array required' }, { status: 400 })
        }

        const servicesResult = await HospitalService.updateHospitalServices(hospitalId, services)
        if (servicesResult.error) throw servicesResult.error

        return NextResponse.json({ 
          success: true, 
          data: servicesResult.data,
          message: 'Hospital services updated successfully' 
        })

      case 'update-doctor-schedule':
        if (!doctorId || !schedule?.availableDays || !schedule?.availableHours) {
          return NextResponse.json({
            success: false,
            error: 'doctorId and schedule fields (availableDays, availableHours) are required',
          }, { status: 400 })
        }

        const scheduleResult = await HospitalService.updateDoctorSchedule(hospitalId, doctorId, {
          availableDays: schedule.availableDays,
          availableHours: schedule.availableHours,
        })
        if (scheduleResult.error) throw scheduleResult.error

        return NextResponse.json({
          success: true,
          data: scheduleResult.data,
          message: 'Doctor schedule updated successfully',
        })

      case 'update-doctor-profile':
        if (!doctorId || !doctorUpdates || typeof doctorUpdates !== 'object') {
          return NextResponse.json({ success: false, error: 'doctorId and doctorUpdates required' }, { status: 400 })
        }

        // Verify doctor belongs to this hospital
        const docCheck = await DoctorService.getDoctor(doctorId)
        if (docCheck.error || docCheck.data?.hospital_id !== hospitalId) {
          return NextResponse.json({ success: false, error: 'Doctor not found in this hospital' }, { status: 404 })
        }

        const docUpdateResult = await DoctorService.updateDoctor(doctorId, doctorUpdates)
        if (docUpdateResult.error) throw docUpdateResult.error

        return NextResponse.json({
          success: true,
          data: docUpdateResult.data,
          message: 'Doctor profile updated successfully',
        })

      case 'update-settings':
        if (!settings || typeof settings !== 'object') {
          return NextResponse.json({ success: false, error: 'settings object required' }, { status: 400 })
        }

        const settingsResult = await HospitalService.updateHospitalSystemSettings(hospitalId, settings)
        if (settingsResult.error) throw settingsResult.error

        return NextResponse.json({
          success: true,
          data: settingsResult.data,
          message: 'System settings updated successfully',
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Hospital Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update hospital' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const hospitalId = searchParams.get('hospitalId')
    const doctorId = searchParams.get('doctorId')

    if (!hospitalId) {
      return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
    }

    switch (action) {
      case 'delete-doctor':
        if (!doctorId) {
          return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
        }

        const deleteResult = await HospitalService.deleteDoctorFromHospital(hospitalId, doctorId)
        if (deleteResult.error) throw deleteResult.error

        return NextResponse.json({
          success: true,
          data: deleteResult.data,
          message: 'Doctor deleted successfully',
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Hospital Delete Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process delete request' }, { status: 500 })
  }
}