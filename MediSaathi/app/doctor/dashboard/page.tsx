'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Users,
  FileText,
  Brain,
  Clock,
  Search,
  Plus,
  Bell,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  Send,
  Phone,
  Video,
  MessageSquare,
  Upload,
  BarChart3,
  Heart,
  Star,
  Filter,
  Timer,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  todayAppointments: any[]
  totalPatients: number
  pendingReviews: number
  recentPatients: any[]
  criticalPatients: any[]
  loading: boolean
}

// Add dummy data for showcase
const dummyData = {
  todayAppointments: [
    {
      id: 'dummy-app-1',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00:00',
      status: 'confirmed',
      appointment_type: 'Consultation',
      notes: 'Follow-up for hypertension management',
      is_urgent: false,
      patients: {
        users: {
          full_name: 'John Smith',
          date_of_birth: '1985-05-15',
          avatar_url: null
        }
      }
    },
    {
      id: 'dummy-app-2',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:30:00',
      status: 'waiting',
      appointment_type: 'Check-up',
      notes: 'Annual physical examination',
      is_urgent: false,
      patients: {
        users: {
          full_name: 'Sarah Johnson',
          date_of_birth: '1990-08-22',
          avatar_url: null
        }
      }
    },
    {
      id: 'dummy-app-3',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '11:15:00',
      status: 'in-progress',
      appointment_type: 'Urgent Care',
      notes: 'Chest pain evaluation',
      is_urgent: true,
      patients: {
        users: {
          full_name: 'Robert Wilson',
          date_of_birth: '1975-12-03',
          avatar_url: null
        }
      }
    },
    {
      id: 'dummy-app-4',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '14:00:00',
      status: 'completed',
      appointment_type: 'Follow-up',
      notes: 'Diabetes management review',
      is_urgent: false,
      patients: {
        users: {
          full_name: 'Maria Garcia',
          date_of_birth: '1982-03-18',
          avatar_url: null
        }
      }
    },
    {
      id: 'dummy-app-5',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '15:30:00',
      status: 'confirmed',
      appointment_type: 'Consultation',
      notes: 'New patient consultation',
      is_urgent: false,
      patients: {
        users: {
          full_name: 'David Brown',
          date_of_birth: '1988-11-07',
          avatar_url: null
        }
      }
    }
  ],
  recentPatients: [
    {
      id: 'dummy-patient-1',
      primary_condition: 'Hypertension',
      risk_level: 'medium',
      last_appointment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      users: {
        full_name: 'Alice Cooper',
        date_of_birth: '1970-06-12',
        avatar_url: null
      }
    },
    {
      id: 'dummy-patient-2',
      primary_condition: 'Diabetes Type 2',
      risk_level: 'high',
      last_appointment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      users: {
        full_name: 'Michael Davis',
        date_of_birth: '1965-09-25',
        avatar_url: null
      }
    },
    {
      id: 'dummy-patient-3',
      primary_condition: 'Asthma',
      risk_level: 'low',
      last_appointment: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      users: {
        full_name: 'Jennifer Lee',
        date_of_birth: '1992-01-30',
        avatar_url: null
      }
    },
    {
      id: 'dummy-patient-4',
      primary_condition: 'Arthritis',
      risk_level: 'medium',
      last_appointment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      users: {
        full_name: 'Thomas Anderson',
        date_of_birth: '1958-04-16',
        avatar_url: null
      }
    },
    {
      id: 'dummy-patient-5',
      primary_condition: 'Migraine',
      risk_level: 'low',
      last_appointment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      users: {
        full_name: 'Emma Thompson',
        date_of_birth: '1987-07-08',
        avatar_url: null
      }
    }
  ],
  criticalPatients: [
    {
      id: 'dummy-critical-1',
      critical_notes: 'Blood pressure readings consistently above 180/120',
      risk_level: 'high',
      users: {
        full_name: 'Richard Parker',
        date_of_birth: '1955-02-14',
        avatar_url: null
      }
    },
    {
      id: 'dummy-critical-2',
      critical_notes: 'Missed insulin doses, glucose levels unstable',
      risk_level: 'high',
      users: {
        full_name: 'Linda Martinez',
        date_of_birth: '1963-10-28',
        avatar_url: null
      }
    }
  ]
}

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayAppointments: [],
    totalPatients: 0,
    pendingReviews: 0,
    recentPatients: [],
    criticalPatients: [],
    loading: true
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [monthStats, setMonthStats] = useState({
    patientsTreated: 0,
    successRate: 0,
    avgRating: 0,
    avgDuration: 0,
    loaded: false,
  })
  const [prescriptionData, setPrescriptionData] = useState({
    patient: 'Sarah Johnson',
    date: '2024-11-23',
    medications: [{ name: '', dosage: '', frequency: '' }],
    instructions: ''
  })

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updatedMedications = [...prescriptionData.medications]
    updatedMedications[index] = { ...updatedMedications[index], [field]: value }
    setPrescriptionData(prev => ({ ...prev, medications: updatedMedications }))
  }

  const addMedication = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '' }]
    }))
  }

  const removeMedication = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  useEffect(() => {
    if (user && user.user_type === 'doctor') {
      loadDoctorDashboardData()
    }
  }, [user])

  const loadDoctorDashboardData = async () => {
    if (!user) return
    
    try {
      const [
        appointmentsResult,
        patientsResult,
        recentPatientsResult,
        criticalPatientsResult
      ] = await Promise.all([
        fetch(`/api/appointments?doctorId=${user.id}&date=${new Date().toISOString().split('T')[0]}`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${user.id}`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${user.id}&recent=true&limit=10`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${user.id}&critical=true`).then(res => res.json())
      ])

      // Use dummy data if database returns empty or error, otherwise use database data
      setDashboardData({
        todayAppointments: (appointmentsResult.data && appointmentsResult.data.length > 0) ? appointmentsResult.data : dummyData.todayAppointments,
        totalPatients: patientsResult.total || (dummyData.recentPatients.length + 15), // Add some extra for total count
        pendingReviews: appointmentsResult.data?.filter((a: any) => a.status === 'pending').length || dummyData.todayAppointments.filter(a => a.status === 'pending').length,
        recentPatients: (recentPatientsResult.data && recentPatientsResult.data.length > 0) ? recentPatientsResult.data : dummyData.recentPatients,
        criticalPatients: (criticalPatientsResult.data && criticalPatientsResult.data.length > 0) ? criticalPatientsResult.data : dummyData.criticalPatients,
        loading: false
      })
    } catch (error) {
      console.error('Error loading doctor dashboard data:', error)
      // Fallback to dummy data on error
      setDashboardData({
        todayAppointments: dummyData.todayAppointments,
        totalPatients: dummyData.recentPatients.length + 15,
        pendingReviews: dummyData.todayAppointments.filter(a => a.status === 'pending').length,
        recentPatients: dummyData.recentPatients,
        criticalPatients: dummyData.criticalPatients,
        loading: false
      })
    }

    // Fetch real performance stats (separate try-catch so main dashboard still loads)
    try {
      const doctorRes = await fetch(`/api/doctors?action=get-by-user&userId=${user.id}`).then(r => r.json())
      if (doctorRes.success && doctorRes.data) {
        const docId = doctorRes.data.id
        const rating = doctorRes.data.rating || 0
        const [analyticsRes, timeRes] = await Promise.all([
          fetch(`/api/doctors?action=analytics&doctorId=${docId}`).then(r => r.json()),
          fetch(`/api/appointments?action=time-tracking&doctorId=${docId}`).then(r => r.json()),
        ])
        const thisMonth = new Date().toISOString().substring(0, 7)
        const a = analyticsRes.success ? analyticsRes.data : null
        const t = timeRes.success ? timeRes.data : null
        if (a) {
          const totalWithOutcome = a.completedCount + a.cancelledCount + a.noShowCount
          setMonthStats({
            patientsTreated: a.monthlyAppointments?.[thisMonth] || 0,
            successRate: totalWithOutcome > 0 ? Math.round((a.completedCount / totalWithOutcome) * 100) : 0,
            avgRating: rating,
            avgDuration: t?.avgDuration || 0,
            loaded: true,
          })
        }
      }
    } catch {
      // Stats will remain at defaults
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in-progress': return 'secondary'
      case 'waiting': return 'outline'
      case 'confirmed': return 'secondary'
      default: return 'outline'
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (authLoading || dashboardData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-green-50/30">
      {/* Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.full_name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'DR'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">Dr. {user?.full_name || 'Doctor'}</h1>
                {/* @ts-ignore */}
                <p className="text-sm text-muted-foreground">{user?.specialty || 'General Practice'} • MediSaathi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                {dashboardData.criticalPatients.length > 0 && (
                  <Badge className="ml-1 h-4 w-4 rounded-full p-0 text-xs">
                    {dashboardData.criticalPatients.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-2xl font-bold">{dashboardData.todayAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold">{dashboardData.totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold">{dashboardData.pendingReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{calculateSuccessRate()}%</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} • {dashboardData.todayAppointments.filter(a => a.status !== 'completed').length} appointments remaining
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              </CardHeader>
              <CardContent>
                {dashboardData.todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.todayAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg card-hover">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">{formatTime(appointment.appointment_time)}</p>
                            <Badge variant={getStatusVariant(appointment.status)} className="text-xs mt-1">
                              {appointment.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{appointment.patients?.users?.full_name || 'Patient'}</p>
                              {appointment.is_urgent && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{appointment.notes || 'General consultation'}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {appointment.appointment_type || 'Consultation'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {appointment.status === 'confirmed' && (
                            <Button size="sm">Start</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No appointments scheduled for today</p>
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Search & Management */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Search and manage your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-9" 
                      placeholder="Search patients..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="all">All Patients</TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent" className="space-y-3">
                    {dashboardData.recentPatients.length > 0 ? (
                      dashboardData.recentPatients.map((patient: any) => (
                        <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg card-hover cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={patient.users?.avatar_url} />
                              <AvatarFallback>
                                {patient.users?.full_name?.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase() || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{patient.users?.full_name || 'Patient'}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.users?.date_of_birth ? 
                                  `${new Date().getFullYear() - new Date(patient.users.date_of_birth).getFullYear()} years` : 
                                  'Age not set'} • 
                                Last visit: {patient.last_appointment ? 
                                  new Date(patient.last_appointment).toLocaleDateString() : 
                                  'No previous visits'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {patient.primary_condition || 'General'}
                                </Badge>
                                <Badge 
                                  variant={patient.risk_level === 'high' ? 'destructive' : 
                                          patient.risk_level === 'medium' ? 'secondary' : 'default'}
                                  className="text-xs"
                                >
                                  {patient.risk_level || 'low'} risk
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">No recent patients</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="critical">
                    <div className="space-y-3">
                      {dashboardData.criticalPatients.length > 0 ? (
                        dashboardData.criticalPatients.map((patient: any) => (
                          <div key={patient.id} className="p-4 border-l-4 border-red-500 bg-red-50/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-red-900">{patient.users?.full_name || 'Critical Patient'}</p>
                                <p className="text-sm text-red-700">{patient.critical_notes || 'Requires immediate attention'}</p>
                              </div>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                <Phone className="h-4 w-4 mr-1" />
                                Call Now
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-gray-500">No critical patients at this time</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="all">
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">View all {dashboardData.totalPatients} patients</p>
                      <Button variant="outline" className="mt-2">
                        Load All Patients
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* E-Prescription */}
            <Card>
              <CardHeader>
                <CardTitle>Create E-Prescription</CardTitle>
                <CardDescription>Digital prescription for current patient</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Patient</label>
                      <Input 
                        placeholder="Select patient..." 
                        value={prescriptionData.patient} 
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, patient: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <Input 
                        type="date" 
                        value={prescriptionData.date}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Medications</label>
                    <div className="space-y-2 mt-2">
                      {prescriptionData.medications.map((medication, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Input 
                            placeholder="Medication name" 
                            className="flex-1" 
                            value={medication.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          />
                          <Input 
                            placeholder="Dosage" 
                            className="w-24" 
                            value={medication.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          />
                          <Input 
                            placeholder="Frequency" 
                            className="w-24" 
                            value={medication.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMedication(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addMedication}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Medication
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Instructions</label>
                    <Textarea 
                      placeholder="Special instructions for the patient..." 
                      value={prescriptionData.instructions}
                      onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button>
                      <Send className="h-4 w-4 mr-1" />
                      Send Prescription
                    </Button>
                    <Button variant="outline">Save Draft</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Medical Insights */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>Medical Insights</CardTitle>
                </div>
                <CardDescription>Based on your patient data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.criticalPatients.length > 0 ? (
                  <div className="p-3 bg-white/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Risk Alert</p>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.criticalPatients.length} patients require immediate attention
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">All Clear</p>
                        <p className="text-xs text-muted-foreground">No critical patients at this time</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-white/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Today's Schedule</p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.todayAppointments.length} appointments scheduled
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Patient Summary - Show first patient from today's appointments */}
            {dashboardData.todayAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Patient Summary</CardTitle>
                  <CardDescription>
                    {dashboardData.todayAppointments[0]?.patients?.users?.full_name || 'Patient'} • 
                    {dashboardData.todayAppointments[0]?.patients?.users?.date_of_birth ? 
                      ` ${new Date().getFullYear() - new Date(dashboardData.todayAppointments[0].patients.users.date_of_birth).getFullYear()} years old` : 
                      ' Age unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Status</span>
                        </div>
                        <p className="text-lg font-bold">{dashboardData.todayAppointments[0]?.status || 'Scheduled'}</p>
                        <p className="text-xs text-blue-600">Next appointment</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Time</span>
                        </div>
                        <p className="text-lg font-bold">{formatTime(dashboardData.todayAppointments[0]?.appointment_time)}</p>
                        <p className="text-xs text-green-600">Today</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Appointment Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {dashboardData.todayAppointments[0]?.notes || 'No specific notes for this appointment'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/doctor/patients/${dashboardData.todayAppointments[0]?.patients?.id || dashboardData.todayAppointments[0]?.patient_id || ''}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-1" />
                          Patient History
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Upload className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/doctor/analytics">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Practice Analytics
                  </Button>
                </Link>
                <Link href="/doctor/insights">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Practice Insights
                  </Button>
                </Link>
                <Link href="/doctor/time-tracking">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Timer className="h-4 w-4 mr-2" />
                    Time Tracking
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Call
                </Button>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month&apos;s Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Patients Treated</span>
                  <span className="font-bold">{monthStats.loaded ? monthStats.patientsTreated : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-bold text-green-600">{monthStats.loaded ? `${monthStats.successRate}%` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{monthStats.loaded ? monthStats.avgRating.toFixed(1) : '—'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Consultation</span>
                  <span className="font-bold">{monthStats.loaded ? `${monthStats.avgDuration} min` : '—'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}