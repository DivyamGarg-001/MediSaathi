'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
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
  Sparkles,
  Loader2,
  RefreshCw,
  ShieldAlert,
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

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
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
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [addNoteOpen, setAddNoteOpen] = useState(false)
  const [addSlotData, setAddSlotData] = useState({
    patient_name: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00',
    type: 'consultation' as string,
    reason: '',
  })
  const [addNoteText, setAddNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState({
    patient: '',
    date: new Date().toISOString().split('T')[0],
    medications: [{ name: '', dosage: '', frequency: '' }],
    instructions: '',
    valid_until: '',
  })

  // AI Practice Insights state
  interface PracticeInsight {
    type: string
    title: string
    description: string
    severity: string
    recommendation: string
  }
  const [practiceInsights, setPracticeInsights] = useState<PracticeInsight[]>([])
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [insightsCached, setInsightsCached] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [insightsGeneratedAt, setInsightsGeneratedAt] = useState<string | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

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
      // Step 1: Resolve the actual doctors.id from user.id
      const doctorRes = await fetch(`/api/doctors?action=get-by-user&userId=${user.id}`).then(r => r.json())
      if (!doctorRes.success || !doctorRes.data) {
        console.error('Could not resolve doctor profile for user:', user.id)
        setDashboardData(prev => ({ ...prev, loading: false }))
        return
      }
      const docId = doctorRes.data.id
      setDoctorId(docId)
      const rating = doctorRes.data.rating || 0

      // Step 2: Fetch all dashboard data using the correct doctors.id
      const now = new Date()
      const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const [
        appointmentsResult,
        patientsResult,
        recentPatientsResult,
        criticalPatientsResult
      ] = await Promise.all([
        fetch(`/api/appointments?doctorId=${docId}&date=${todayLocal}`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${docId}`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${docId}&recent=true&limit=10`).then(res => res.json()),
        fetch(`/api/doctors/patients?doctorId=${docId}&critical=true`).then(res => res.json())
      ])

      setDashboardData({
        todayAppointments: appointmentsResult.data || [],
        totalPatients: patientsResult.total || 0,
        pendingReviews: appointmentsResult.data?.filter((a: any) => a.status === 'pending').length || 0,
        recentPatients: recentPatientsResult.data || [],
        criticalPatients: criticalPatientsResult.data || [],
        loading: false
      })

      // Step 3: Fetch performance stats using the same docId
      try {
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
      } catch {
        // Stats will remain at defaults
      }
    } catch (error) {
      console.error('Error loading doctor dashboard data:', error)
      setDashboardData({
        todayAppointments: [],
        totalPatients: 0,
        pendingReviews: 0,
        recentPatients: [],
        criticalPatients: [],
        loading: false
      })
    }
  }

  // AI Practice Insights functions
  const loadPracticeInsights = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/ai/doctor/insights?user_id=${user.id}`).then(r => r.json())
      if (res.success && res.insights?.length > 0) {
        setPracticeInsights(res.insights)
        setInsightsCached(res.cached || false)
        setInsightsGeneratedAt(res.generated_at || null)
      }
    } catch {
      // Silently fail — insights are optional
    }
  }

  const generatePracticeInsights = async () => {
    if (!user || isGeneratingInsights) return
    setIsGeneratingInsights(true)
    setInsightsError('')
    try {
      const res = await fetch('/api/ai/doctor/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      }).then(r => r.json())

      if (res.success && res.insights?.length > 0) {
        setPracticeInsights(res.insights)
        setInsightsCached(false)
        setInsightsGeneratedAt(res.generated_at || null)
        setInsightsError('')
      } else {
        setInsightsError(res.error || 'Failed to generate insights')
      }
    } catch {
      setInsightsError('AI service unavailable. Make sure the FastAPI backend is running.')
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // Load cached practice insights on mount
  useEffect(() => {
    if (user && user.user_type === 'doctor') {
      loadPracticeInsights()
    }
  }, [user])

  // Notifications
  const loadNotifications = async () => {
    if (!user) return
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`/api/notifications?userId=${user.id}`).then(r => r.json()),
        fetch(`/api/notifications?userId=${user.id}&action=unread-count`).then(r => r.json()),
      ])
      setNotifications(notifRes.data || [])
      setUnreadCount(countRes.data || 0)
    } catch {
      // Silently fail
    }
  }

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', notificationId }),
      })
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const markAllNotificationsRead = async () => {
    if (!user) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read', userId: user.id }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (user && user.user_type === 'doctor') {
      loadNotifications()
    }
  }, [user])

  const handleAddSlot = async () => {
    if (!doctorId || !addSlotData.appointment_date || !addSlotData.appointment_time || !addSlotData.reason) {
      toast.error('Please fill in date, time, and reason')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          appointmentData: {
            doctor_id: doctorId,
            patient_id: user?.id,
            appointment_date: addSlotData.appointment_date,
            appointment_time: addSlotData.appointment_time,
            type: addSlotData.type,
            reason: addSlotData.reason,
          }
        })
      }).then(r => r.json())
      if (res.success) {
        toast.success('Appointment slot added')
        setAddSlotOpen(false)
        setAddSlotData({ patient_name: '', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '09:00', type: 'consultation', reason: '' })
        loadDoctorDashboardData()
      } else {
        toast.error(res.error || 'Failed to add slot')
      }
    } catch {
      toast.error('Failed to add slot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNote = async () => {
    const appointment = dashboardData.todayAppointments[0]
    if (!appointment?.id) {
      toast.error('No appointment selected')
      return
    }
    if (!addNoteText.trim()) {
      toast.error('Please enter a note')
      return
    }
    setSubmitting(true)
    try {
      const existingNotes = appointment.notes || ''
      const updatedNotes = existingNotes ? `${existingNotes}\n${addNoteText}` : addNoteText
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          appointmentId: appointment.id,
          updates: { notes: updatedNotes }
        })
      }).then(r => r.json())
      if (res.success) {
        toast.success('Note added')
        setAddNoteOpen(false)
        setAddNoteText('')
        loadDoctorDashboardData()
      } else {
        toast.error(res.error || 'Failed to add note')
      }
    } catch {
      toast.error('Failed to add note')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendPrescription = async () => {
    if (!doctorId) {
      toast.error('Doctor profile not loaded')
      return
    }
    const validMeds = prescriptionData.medications.filter(m => m.name.trim())
    if (validMeds.length === 0) {
      toast.error('Add at least one medication')
      return
    }
    if (!prescriptionData.valid_until) {
      toast.error('Please set a valid until date')
      return
    }
    setSubmitting(true)
    try {
      // Find patient ID from recent patients by name match
      const matchedPatient = dashboardData.recentPatients.find(
        (p: any) => p.full_name?.toLowerCase() === prescriptionData.patient.toLowerCase()
      )
      const patientId = matchedPatient?.id
      if (!patientId) {
        toast.error('Please enter a valid patient name from your patients list')
        setSubmitting(false)
        return
      }
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionData: {
            doctor_id: doctorId,
            patient_id: patientId,
            medications: validMeds,
            instructions: prescriptionData.instructions,
            valid_until: prescriptionData.valid_until,
          }
        })
      }).then(r => r.json())
      if (res.success) {
        toast.success('Prescription sent successfully')
        setPrescriptionData({ patient: '', date: new Date().toISOString().split('T')[0], medications: [{ name: '', dosage: '', frequency: '' }], instructions: '', valid_until: '' })
      } else {
        toast.error(res.error || 'Failed to send prescription')
      }
    } catch {
      toast.error('Failed to send prescription')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200'
      case 'in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'completed': return 'bg-gray-50 text-gray-600 border-gray-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      case 'no_show': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return ''
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
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadNotifications() }}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-3 border-b">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unreadCount > 0 && (
                        <button className="text-xs text-primary hover:underline" onClick={markAllNotificationsRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 20).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => { if (!notif.is_read) markNotificationRead(notif.id) }}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                            <div className={!notif.is_read ? '' : 'ml-4'}>
                              <p className="text-sm font-medium">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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
                <Button size="sm" onClick={() => setAddSlotOpen(true)}>
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
                            <Badge variant="outline" className={`text-xs mt-1 ${getStatusColor(appointment.status)}`}>
                              {appointment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{appointment.patient?.full_name || 'Patient'}</p>
                              {appointment.is_urgent && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{appointment.notes || 'General consultation'}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {appointment.type || 'Consultation'}
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
                        <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg card-hover cursor-pointer" onClick={() => router.push(`/doctor/patients/${patient.id}`)}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={patient.avatar_url} />
                              <AvatarFallback>
                                {patient.full_name?.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase() || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{patient.full_name || 'Patient'}</p>
                              <p className="text-xs text-muted-foreground">
                                {patient.date_of_birth ?
                                  `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` :
                                  'Age not set'} •
                                {patient.next_appointment
                                  ? `Next visit: ${new Date(patient.next_appointment + 'T00:00:00').toLocaleDateString()}`
                                  : patient.last_appointment
                                    ? `Last visit: ${new Date(patient.last_appointment + 'T00:00:00').toLocaleDateString()}`
                                    : 'No visits'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/doctor/patients/${patient.id}`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
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
                          <div key={patient.id} className="p-4 border-l-4 border-red-500 bg-red-50/50 rounded-lg cursor-pointer" onClick={() => router.push(`/doctor/patients/${patient.id}`)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-red-900">{patient.full_name || 'Critical Patient'}</p>
                                <p className="text-sm text-red-700">Requires immediate attention</p>
                              </div>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={(e) => e.stopPropagation()}>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Valid Until</label>
                      <Input
                        type="date"
                        value={prescriptionData.valid_until}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, valid_until: e.target.value }))}
                      />
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
                    <Button onClick={handleSendPrescription} disabled={submitting}>
                      <Send className="h-4 w-4 mr-1" />
                      {submitting ? 'Sending...' : 'Send Prescription'}
                    </Button>
                    <Button variant="outline" onClick={() => toast.success('Draft saved locally')}>Save Draft</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Practice Insights */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <CardTitle>AI Practice Insights</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant={practiceInsights.length > 0 ? "outline" : "default"}
                    onClick={generatePracticeInsights}
                    disabled={isGeneratingInsights}
                    className="text-xs"
                  >
                    {isGeneratingInsights ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing...</>
                    ) : practiceInsights.length > 0 ? (
                      <><RefreshCw className="h-3 w-3 mr-1" /> Refresh</>
                    ) : (
                      <><Sparkles className="h-3 w-3 mr-1" /> Generate</>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {insightsGeneratedAt
                    ? `Last updated: ${new Date(insightsGeneratedAt).toLocaleString()}`
                    : 'AI-powered analysis of your practice performance'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insightsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{insightsError}</p>
                  </div>
                )}

                {practiceInsights.length > 0 ? (
                  practiceInsights.map((insight, idx) => {
                    const severityConfig: Record<string, { border: string; icon: React.ReactNode }> = {
                      low: { border: 'border-l-green-500', icon: <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> },
                      medium: { border: 'border-l-yellow-500', icon: <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" /> },
                      high: { border: 'border-l-orange-500', icon: <ShieldAlert className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" /> },
                    }
                    const config = severityConfig[insight.severity] || severityConfig.low
                    return (
                      <div key={idx} className={`p-3 bg-white/50 rounded-lg border-l-4 ${config.border}`}>
                        <div className="flex items-start gap-2">
                          {config.icon}
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                            {insight.recommendation && (
                              <p className="text-xs text-primary mt-1 font-medium">{insight.recommendation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : !isGeneratingInsights ? (
                  <div className="text-center py-4">
                    <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click &quot;Generate&quot; to get AI-powered practice insights
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on your appointments, patients, and prescriptions
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
                    <p className="mt-2 text-sm text-muted-foreground">Analyzing your practice data...</p>
                  </div>
                )}

                {insightsCached && practiceInsights.length > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Showing cached insights. Click Refresh for latest analysis.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Current Patient Summary - Show first patient from today's appointments */}
            {dashboardData.todayAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Patient Summary</CardTitle>
                  <CardDescription>
                    {dashboardData.todayAppointments[0]?.patient?.full_name || 'Patient'} •
                    {dashboardData.todayAppointments[0]?.patient?.date_of_birth ?
                      ` ${new Date().getFullYear() - new Date(dashboardData.todayAppointments[0].patient.date_of_birth).getFullYear()} years old` :
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
                      {(() => {
                        const patientId = dashboardData.todayAppointments[0]?.patient?.id || dashboardData.todayAppointments[0]?.patient_id
                        return patientId ? (
                          <Link href={`/doctor/patients/${patientId}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <FileText className="h-4 w-4 mr-1" />
                              Patient History
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" className="flex-1" disabled>
                            <FileText className="h-4 w-4 mr-1" />
                            Patient History
                          </Button>
                        )
                      })()}
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setAddNoteOpen(true)}>
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

      {/* Add Slot Dialog */}
      <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Appointment Slot</DialogTitle>
            <DialogDescription>Schedule a new appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={addSlotData.appointment_date} onChange={(e) => setAddSlotData(prev => ({ ...prev, appointment_date: e.target.value }))} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={addSlotData.appointment_time} onChange={(e) => setAddSlotData(prev => ({ ...prev, appointment_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={addSlotData.type} onValueChange={(v) => setAddSlotData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="telemedicine">Telemedicine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input placeholder="Reason for appointment..." value={addSlotData.reason} onChange={(e) => setAddSlotData(prev => ({ ...prev, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSlot} disabled={submitting}>{submitting ? 'Adding...' : 'Add Slot'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to the current appointment</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Enter your note..." value={addNoteText} onChange={(e) => setAddNoteText(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={submitting}>{submitting ? 'Saving...' : 'Save Note'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}