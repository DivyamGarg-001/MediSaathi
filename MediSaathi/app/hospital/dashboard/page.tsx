'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building2,
  Calendar,
  Download,
  Settings,
  Stethoscope,
  Trash2,
  UserPlus,
  FileBarChart,
} from 'lucide-react'

type HospitalProfile = {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website: string | null
  total_beds: number
  available_beds: number
  departments: string[]
  services: string[]
  emergency_services: boolean
}

type DoctorRecord = {
  id: string
  specialty: string
  license_number: string
  available_days: string[]
  available_hours: string
  experience_years: number
  consultation_fee: number | null
  users?: {
    full_name?: string | null
    email?: string | null
    phone?: string | null
  }
}

type HospitalReport = {
  generatedAt: string
  summary: {
    totalDoctors: number
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    noShowAppointments: number
    totalRevenue: number
    averageDoctorRating: number
  }
  appointmentsByStatus: Record<string, number>
  appointmentsByType: Record<string, number>
  appointmentsBySpecialty: Record<string, number>
  monthlyAppointments: Record<string, number>
  revenueByMonth: Record<string, number>
}

const dayOptions = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export default function HospitalDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [hospital, setHospital] = useState<HospitalProfile | null>(null)
  const [doctors, setDoctors] = useState<DoctorRecord[]>([])
  const [report, setReport] = useState<HospitalReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>('')

  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    licenseNumber: '',
    experienceYears: '0',
    consultationFee: '',
    availableHours: '09:00-17:00',
  })

  const [scheduleForm, setScheduleForm] = useState({
    doctorId: '',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    availableHours: '09:00-17:00',
  })

  const [reportFilter, setReportFilter] = useState({ fromDate: '', toDate: '' })

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    totalBeds: 0,
    availableBeds: 0,
    departments: '',
    services: '',
    emergencyServices: true,
  })

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === scheduleForm.doctorId),
    [doctors, scheduleForm.doctorId]
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user?.user_type === 'hospital') {
      void loadHospitalData(user.id)
    }
  }, [user])

  const loadHospitalData = async (userId: string) => {
    setLoading(true)
    setMessage('')
    try {
      const hospitalRes = await fetch(`/api/hospitals?action=get-by-user&userId=${userId}`)
      const hospitalJson = await hospitalRes.json()

      if (!hospitalRes.ok || !hospitalJson?.data?.id) {
        throw new Error(hospitalJson?.error || 'Hospital profile not found')
      }

      const hospitalData: HospitalProfile = hospitalJson.data
      setHospital(hospitalData)
      setSettingsForm({
        name: hospitalData.name,
        address: hospitalData.address,
        phone: hospitalData.phone,
        email: hospitalData.email,
        website: hospitalData.website || '',
        totalBeds: hospitalData.total_beds,
        availableBeds: hospitalData.available_beds,
        departments: (hospitalData.departments || []).join(', '),
        services: (hospitalData.services || []).join(', '),
        emergencyServices: hospitalData.emergency_services,
      })

      await Promise.all([loadDoctors(hospitalData.id), loadReport(hospitalData.id)])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load hospital dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadDoctors = async (hospitalId: string) => {
    const doctorsRes = await fetch(`/api/doctors?action=by-hospital&hospitalId=${hospitalId}`)
    const doctorsJson = await doctorsRes.json()

    if (!doctorsRes.ok) {
      throw new Error(doctorsJson?.error || 'Failed to load doctors')
    }

    const records: DoctorRecord[] = doctorsJson.data || []
    setDoctors(records)

    if (!scheduleForm.doctorId && records.length > 0) {
      setScheduleForm({
        doctorId: records[0].id,
        availableDays: records[0].available_days || [],
        availableHours: records[0].available_hours || '09:00-17:00',
      })
    }
  }

  const loadReport = async (hospitalId: string) => {
    const params = new URLSearchParams({ action: 'report', hospitalId })
    if (reportFilter.fromDate) params.set('fromDate', reportFilter.fromDate)
    if (reportFilter.toDate) params.set('toDate', reportFilter.toDate)

    const reportRes = await fetch(`/api/hospitals?${params.toString()}`)
    const reportJson = await reportRes.json()

    if (!reportRes.ok) {
      throw new Error(reportJson?.error || 'Failed to generate report')
    }

    setReport(reportJson.data || null)
  }

  const handleAddDoctor = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!hospital) return

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-doctor',
          hospitalId: hospital.id,
          doctorData: {
            fullName: doctorForm.fullName,
            email: doctorForm.email,
            phone: doctorForm.phone || undefined,
            password: doctorForm.password,
            specialty: doctorForm.specialty,
            licenseNumber: doctorForm.licenseNumber,
            experienceYears: Number(doctorForm.experienceYears || 0),
            consultationFee: doctorForm.consultationFee ? Number(doctorForm.consultationFee) : undefined,
            availableHours: doctorForm.availableHours,
            availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          },
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to add doctor')
      }

      setMessage('Doctor added successfully.')
      setDoctorForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        specialty: '',
        licenseNumber: '',
        experienceYears: '0',
        consultationFee: '',
        availableHours: '09:00-17:00',
      })
      await Promise.all([loadDoctors(hospital.id), loadReport(hospital.id)])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add doctor')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!hospital) return
    const confirmed = window.confirm('Delete this doctor? This removes their login and linked profile.')
    if (!confirmed) return

    setBusy(true)
    setMessage('')
    try {
      const params = new URLSearchParams({
        action: 'delete-doctor',
        hospitalId: hospital.id,
        doctorId,
      })

      const response = await fetch(`/api/hospitals?${params.toString()}`, { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to delete doctor')
      }

      setMessage('Doctor deleted successfully.')
      await Promise.all([loadDoctors(hospital.id), loadReport(hospital.id)])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete doctor')
    } finally {
      setBusy(false)
    }
  }

  const applyDoctorToSchedule = (doctor: DoctorRecord) => {
    setScheduleForm({
      doctorId: doctor.id,
      availableDays: doctor.available_days || [],
      availableHours: doctor.available_hours || '09:00-17:00',
    })
  }

  const handleToggleDay = (day: string, checked: boolean) => {
    setScheduleForm((prev) => {
      const hasDay = prev.availableDays.includes(day)
      if (checked && !hasDay) {
        return { ...prev, availableDays: [...prev.availableDays, day] }
      }
      if (!checked && hasDay) {
        return { ...prev, availableDays: prev.availableDays.filter((item) => item !== day) }
      }
      return prev
    })
  }

  const handleSaveSchedule = async () => {
    if (!hospital || !scheduleForm.doctorId) return

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/hospitals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-doctor-schedule',
          hospitalId: hospital.id,
          doctorId: scheduleForm.doctorId,
          schedule: {
            availableDays: scheduleForm.availableDays,
            availableHours: scheduleForm.availableHours,
          },
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update schedule')
      }

      setMessage('Doctor schedule updated successfully.')
      await loadDoctors(hospital.id)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update schedule')
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerateReport = async () => {
    if (!hospital) return
    setBusy(true)
    setMessage('')
    try {
      await loadReport(hospital.id)
      setMessage('Report generated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadReportCsv = () => {
    if (!report) return

    const rows = [
      ['metric', 'value'],
      ['total_doctors', String(report.summary.totalDoctors)],
      ['total_appointments', String(report.summary.totalAppointments)],
      ['completed_appointments', String(report.summary.completedAppointments)],
      ['cancelled_appointments', String(report.summary.cancelledAppointments)],
      ['no_show_appointments', String(report.summary.noShowAppointments)],
      ['total_revenue', String(report.summary.totalRevenue)],
      ['average_doctor_rating', String(report.summary.averageDoctorRating)],
    ]

    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hospital-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!hospital) return

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/hospitals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          hospitalId: hospital.id,
          settings: {
            name: settingsForm.name,
            address: settingsForm.address,
            phone: settingsForm.phone,
            email: settingsForm.email,
            website: settingsForm.website || null,
            totalBeds: Number(settingsForm.totalBeds),
            availableBeds: Number(settingsForm.availableBeds),
            departments: settingsForm.departments
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            services: settingsForm.services
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            emergencyServices: settingsForm.emergencyServices,
          },
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save settings')
      }

      setHospital((prev) => (prev ? { ...prev, ...result.data } : prev))
      setMessage('System settings updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setBusy(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className='container py-10'>
        <p className='text-sm text-muted-foreground'>Loading hospital dashboard...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'hospital') {
    return (
      <div className='container py-10'>
        <p className='text-sm text-muted-foreground'>Hospital access required.</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-muted/20'>
      <div className='border-b bg-background'>
        <div className='container py-6'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-primary/10 p-2'>
                <Building2 className='h-6 w-6 text-primary' />
              </div>
              <div>
                <h1 className='text-xl font-semibold'>{hospital?.name || 'Hospital Dashboard'}</h1>
                <p className='text-sm text-muted-foreground'>Doctor management, schedules, reports, and system settings</p>
              </div>
            </div>
            <Badge variant='secondary'>{doctors.length} doctors</Badge>
          </div>
        </div>
      </div>

      <div className='container py-8 space-y-4'>
        {message ? <p className='text-sm'>{message}</p> : null}

        <Tabs defaultValue='doctor-management' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-2 md:grid-cols-4'>
            <TabsTrigger value='doctor-management'>Doctor Management</TabsTrigger>
            <TabsTrigger value='schedules'>Manage Schedules</TabsTrigger>
            <TabsTrigger value='reports'>Generate Reports</TabsTrigger>
            <TabsTrigger value='settings'>System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='doctor-management'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <UserPlus className='h-4 w-4' /> Add Doctor
                  </CardTitle>
                  <CardDescription>Create a doctor login and hospital profile in one step.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddDoctor} className='space-y-3'>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorName'>Full name</Label>
                        <Input
                          id='doctorName'
                          required
                          value={doctorForm.fullName}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorEmail'>Email</Label>
                        <Input
                          id='doctorEmail'
                          type='email'
                          required
                          value={doctorForm.email}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, email: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorPassword'>Temporary password</Label>
                        <Input
                          id='doctorPassword'
                          type='password'
                          required
                          value={doctorForm.password}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, password: event.target.value }))}
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorPhone'>Phone</Label>
                        <Input
                          id='doctorPhone'
                          value={doctorForm.phone}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorSpecialty'>Specialty</Label>
                        <Input
                          id='doctorSpecialty'
                          required
                          value={doctorForm.specialty}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, specialty: event.target.value }))}
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorLicense'>License number</Label>
                        <Input
                          id='doctorLicense'
                          required
                          value={doctorForm.licenseNumber}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className='grid gap-3 md:grid-cols-3'>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorExperience'>Experience years</Label>
                        <Input
                          id='doctorExperience'
                          type='number'
                          min={0}
                          value={doctorForm.experienceYears}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, experienceYears: event.target.value }))}
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorFee'>Consultation fee</Label>
                        <Input
                          id='doctorFee'
                          type='number'
                          min={0}
                          value={doctorForm.consultationFee}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, consultationFee: event.target.value }))}
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label htmlFor='doctorHours'>Available hours</Label>
                        <Input
                          id='doctorHours'
                          value={doctorForm.availableHours}
                          onChange={(event) => setDoctorForm((prev) => ({ ...prev, availableHours: event.target.value }))}
                        />
                      </div>
                    </div>

                    <Button type='submit' disabled={busy}>
                      <UserPlus className='mr-2 h-4 w-4' />
                      Add doctor
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Stethoscope className='h-4 w-4' /> Current Doctors
                  </CardTitle>
                  <CardDescription>Delete doctor accounts or open them for schedule updates.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {doctors.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>No doctors found for this hospital.</p>
                  ) : (
                    doctors.map((doctor) => (
                      <div key={doctor.id} className='rounded border p-3 space-y-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <div>
                            <p className='font-medium'>{doctor.users?.full_name || 'Doctor'}</p>
                            <p className='text-xs text-muted-foreground'>{doctor.users?.email || 'No email'}</p>
                          </div>
                          <Badge variant='outline'>{doctor.specialty}</Badge>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          License: {doctor.license_number} | Hours: {doctor.available_hours}
                        </p>
                        <div className='flex gap-2'>
                          <Button variant='outline' size='sm' onClick={() => applyDoctorToSchedule(doctor)}>
                            <Calendar className='mr-1 h-4 w-4' /> Schedule
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            disabled={busy}
                            onClick={() => handleDeleteDoctor(doctor.id)}
                          >
                            <Trash2 className='mr-1 h-4 w-4' /> Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='schedules'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' /> Manage Doctor Schedules
                </CardTitle>
                <CardDescription>Update available days and working hour range for each doctor.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-1'>
                  <Label>Select doctor</Label>
                  <div className='grid gap-2 md:grid-cols-2'>
                    {doctors.map((doctor) => (
                      <Button
                        key={doctor.id}
                        type='button'
                        variant={scheduleForm.doctorId === doctor.id ? 'default' : 'outline'}
                        onClick={() => applyDoctorToSchedule(doctor)}
                      >
                        {(doctor.users?.full_name || 'Doctor') + ' - ' + doctor.specialty}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedDoctor ? (
                  <>
                    <div className='space-y-2'>
                      <Label>Available days</Label>
                      <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
                        {dayOptions.map((day) => (
                          <label key={day} className='flex items-center gap-2 rounded border px-2 py-1 text-sm'>
                            <Checkbox
                              checked={scheduleForm.availableDays.includes(day)}
                              onCheckedChange={(checked) => handleToggleDay(day, checked === true)}
                            />
                            {day}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className='max-w-xs space-y-1'>
                      <Label htmlFor='scheduleHours'>Available hours</Label>
                      <Input
                        id='scheduleHours'
                        value={scheduleForm.availableHours}
                        onChange={(event) =>
                          setScheduleForm((prev) => ({ ...prev, availableHours: event.target.value }))
                        }
                      />
                    </div>

                    <Button disabled={busy} onClick={handleSaveSchedule}>
                      Save schedule
                    </Button>
                  </>
                ) : (
                  <p className='text-sm text-muted-foreground'>Add a doctor first to manage schedules.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='reports'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileBarChart className='h-4 w-4' /> Generate Reports
                </CardTitle>
                <CardDescription>Generate analytics across appointments, revenue, and specialties.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 md:grid-cols-3'>
                  <div className='space-y-1'>
                    <Label htmlFor='fromDate'>From date</Label>
                    <Input
                      id='fromDate'
                      type='date'
                      value={reportFilter.fromDate}
                      onChange={(event) => setReportFilter((prev) => ({ ...prev, fromDate: event.target.value }))}
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor='toDate'>To date</Label>
                    <Input
                      id='toDate'
                      type='date'
                      value={reportFilter.toDate}
                      onChange={(event) => setReportFilter((prev) => ({ ...prev, toDate: event.target.value }))}
                    />
                  </div>
                  <div className='flex items-end gap-2'>
                    <Button disabled={busy} onClick={handleRegenerateReport}>
                      Generate
                    </Button>
                    <Button type='button' variant='outline' onClick={handleDownloadReportCsv} disabled={!report}>
                      <Download className='mr-1 h-4 w-4' /> CSV
                    </Button>
                  </div>
                </div>

                {report ? (
                  <div className='space-y-4'>
                    <div className='grid gap-3 md:grid-cols-4'>
                      <Card>
                        <CardContent className='pt-4'>
                          <p className='text-xs text-muted-foreground'>Total doctors</p>
                          <p className='text-2xl font-semibold'>{report.summary.totalDoctors}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='pt-4'>
                          <p className='text-xs text-muted-foreground'>Appointments</p>
                          <p className='text-2xl font-semibold'>{report.summary.totalAppointments}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='pt-4'>
                          <p className='text-xs text-muted-foreground'>Completed</p>
                          <p className='text-2xl font-semibold'>{report.summary.completedAppointments}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='pt-4'>
                          <p className='text-xs text-muted-foreground'>Revenue</p>
                          <p className='text-2xl font-semibold'>${report.summary.totalRevenue.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='rounded border p-3'>
                        <p className='mb-2 text-sm font-medium'>Appointments by status</p>
                        <div className='space-y-1 text-sm'>
                          {Object.entries(report.appointmentsByStatus).map(([key, value]) => (
                            <div key={key} className='flex justify-between'>
                              <span>{key}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className='rounded border p-3'>
                        <p className='mb-2 text-sm font-medium'>Appointments by specialty</p>
                        <div className='space-y-1 text-sm'>
                          {Object.entries(report.appointmentsBySpecialty).map(([key, value]) => (
                            <div key={key} className='flex justify-between'>
                              <span>{key}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No report generated yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='settings'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-4 w-4' /> System Settings
                </CardTitle>
                <CardDescription>Update operational details and platform-level hospital preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className='space-y-4' onSubmit={handleSaveSettings}>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <Label htmlFor='hospitalName'>Hospital name</Label>
                      <Input
                        id='hospitalName'
                        value={settingsForm.name}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='hospitalWebsite'>Website</Label>
                      <Input
                        id='hospitalWebsite'
                        value={settingsForm.website}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, website: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='hospitalAddress'>Address</Label>
                    <Input
                      id='hospitalAddress'
                      value={settingsForm.address}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, address: event.target.value }))}
                    />
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <Label htmlFor='hospitalPhone'>Phone</Label>
                      <Input
                        id='hospitalPhone'
                        value={settingsForm.phone}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='hospitalEmail'>Email</Label>
                      <Input
                        id='hospitalEmail'
                        type='email'
                        value={settingsForm.email}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <Label htmlFor='totalBeds'>Total beds</Label>
                      <Input
                        id='totalBeds'
                        type='number'
                        min={0}
                        value={settingsForm.totalBeds}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, totalBeds: Number(event.target.value) }))}
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='availableBeds'>Available beds</Label>
                      <Input
                        id='availableBeds'
                        type='number'
                        min={0}
                        value={settingsForm.availableBeds}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({ ...prev, availableBeds: Number(event.target.value) }))
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='departments'>Departments (comma separated)</Label>
                    <Input
                      id='departments'
                      value={settingsForm.departments}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, departments: event.target.value }))}
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='services'>Services (comma separated)</Label>
                    <Input
                      id='services'
                      value={settingsForm.services}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, services: event.target.value }))}
                    />
                  </div>

                  <div className='flex items-center justify-between rounded border p-3'>
                    <div>
                      <p className='text-sm font-medium'>Emergency services enabled</p>
                      <p className='text-xs text-muted-foreground'>Allow emergency admission and listing in emergency searches.</p>
                    </div>
                    <Switch
                      checked={settingsForm.emergencyServices}
                      onCheckedChange={(value) => setSettingsForm((prev) => ({ ...prev, emergencyServices: value }))}
                    />
                  </div>

                  <Button type='submit' disabled={busy}>
                    Save settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
