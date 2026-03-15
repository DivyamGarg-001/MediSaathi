import { NextRequest, NextResponse } from 'next/server'
import { DoctorService } from '@/lib/services/doctor.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const doctorId = searchParams.get('doctorId')
    const hospitalId = searchParams.get('hospitalId')
    const query = searchParams.get('q')
    const specialty = searchParams.get('specialty')
    const limit = searchParams.get('limit')

    switch (action) {
      case 'get-by-user':
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }
        const userResult = await DoctorService.getDoctorByUserId(userId)
        if (userResult.error) throw userResult.error
        return NextResponse.json({ success: true, data: userResult.data })

      case 'get-doctor':
        if (!doctorId) {
          return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
        }
        const doctorResult = await DoctorService.getDoctor(doctorId)
        if (doctorResult.error) throw doctorResult.error
        return NextResponse.json({ success: true, data: doctorResult.data })

      case 'search':
        const searchResult = await DoctorService.searchDoctors(
          query || undefined,
          specialty || undefined,
          hospitalId || undefined
        )
        if (searchResult.error) throw searchResult.error
        return NextResponse.json({ success: true, data: searchResult.data })

      case 'by-hospital':
        if (!hospitalId) {
          return NextResponse.json({ success: false, error: 'Hospital ID required' }, { status: 400 })
        }
        const hospitalResult = await DoctorService.getDoctorsByHospital(hospitalId)
        if (hospitalResult.error) throw hospitalResult.error
        return NextResponse.json({ success: true, data: hospitalResult.data })

      case 'patients':
        if (!doctorId) {
          return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
        }
        const patientsResult = await DoctorService.getDoctorPatients(doctorId)
        if (patientsResult.error) throw patientsResult.error
        return NextResponse.json({ success: true, data: patientsResult.data })

      case 'stats':
        if (!doctorId) {
          return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
        }
        const statsResult = await DoctorService.getDoctorStats(doctorId)
        if (statsResult.error) throw statsResult.error
        return NextResponse.json({ success: true, data: statsResult.data })

      case 'specialties':
        const specialtiesResult = await DoctorService.getSpecialties()
        if (specialtiesResult.error) throw specialtiesResult.error
        return NextResponse.json({ success: true, data: specialtiesResult.data })

      case 'top-rated':
        const topResult = await DoctorService.getTopRatedDoctors(limit ? parseInt(limit) : 10)
        if (topResult.error) throw topResult.error
        return NextResponse.json({ success: true, data: topResult.data })

      case 'patient-timeline':
        if (!doctorId || !searchParams.get('patientId')) {
          return NextResponse.json({ success: false, error: 'Doctor ID and Patient ID required' }, { status: 400 })
        }
        const timelineResult = await DoctorService.getPatientTimeline(searchParams.get('patientId')!, doctorId)
        if (timelineResult.error) throw timelineResult.error
        return NextResponse.json({ success: true, data: timelineResult.data })

      case 'analytics':
        if (!doctorId) {
          return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
        }
        const analyticsResult = await DoctorService.getDoctorAnalytics(doctorId)
        if (analyticsResult.error) throw analyticsResult.error
        return NextResponse.json({ success: true, data: analyticsResult.data })

      case 'check-availability':
        const date = searchParams.get('date')
        const time = searchParams.get('time')
        if (!doctorId || !date || !time) {
          return NextResponse.json({ success: false, error: 'Doctor ID, date, and time required' }, { status: 400 })
        }
        const availabilityResult = await DoctorService.isDoctorAvailable(doctorId, date, time)
        return NextResponse.json({ success: true, data: availabilityResult })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Doctors API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, doctorData } = body

    switch (action) {
      case 'create':
        if (!doctorData.user_id || !doctorData.specialty || !doctorData.license_number) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required doctor data missing (user_id, specialty, license_number)' 
          }, { status: 400 })
        }

        const result = await DoctorService.createDoctor(doctorData)
        if (result.error) throw result.error

        return NextResponse.json({ 
          success: true, 
          data: result.data,
          message: 'Doctor profile created successfully' 
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Doctor Creation Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create doctor profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, doctorId, updates, rating } = body

    if (!doctorId) {
      return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 })
    }

    switch (action) {
      case 'update':
        const updateResult = await DoctorService.updateDoctor(doctorId, updates)
        if (updateResult.error) throw updateResult.error

        return NextResponse.json({ 
          success: true, 
          data: updateResult.data,
          message: 'Doctor profile updated successfully' 
        })

      case 'update-rating':
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ success: false, error: 'Valid rating (1-5) required' }, { status: 400 })
        }

        const ratingResult = await DoctorService.updateDoctorRating(doctorId, rating)
        if (ratingResult.error) throw ratingResult.error

        return NextResponse.json({ 
          success: true, 
          data: ratingResult.data,
          message: 'Doctor rating updated successfully' 
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Doctor Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update doctor' }, { status: 500 })
  }
}