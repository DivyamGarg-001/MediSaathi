'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Users,
  Activity,
  FileText,
  Calendar as CalendarIcon,
  Bell,
  Wallet,
  Upload,
  Brain,
  AlertCircle,
  TrendingUp,
  Heart,
  Thermometer,
  Weight,
  BarChart3,
  Clock,
  MapPin,
  Phone,
  Mail,
  Plus,
  Settings,
  Download,
  X,
  Pill,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CalendarClock,
  XCircle,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  healthRecords: any[]
  upcomingAppointments: any[]
  latestVitals: any[]
  familyMembers: any[]
  loading: boolean
}

interface WalletSummary {
  totalExpenses: number
  totalIncome: number
  totalClaims: number
  netSpend: number
  byCategory: Record<string, number>
  transactionCount: number
}

interface AIInsight {
  type: 'risk_prediction' | 'health_trend' | 'medication_reminder' | 'checkup_due'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

export default function PatientDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    healthRecords: [],
    upcomingAppointments: [],
    latestVitals: [],
    familyMembers: [],
    loading: true
  })
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [selectedVital, setSelectedVital] = useState('blood_pressure')
  const [vitalValue, setVitalValue] = useState('')
  const [isAddingVital, setIsAddingVital] = useState(false)

  // Add Family Member state
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false)
  const [isAddingFamily, setIsAddingFamily] = useState(false)
  const [familyMemberForm, setFamilyMemberForm] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    emergency_contact: false
  })

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploadingRecord, setIsUploadingRecord] = useState(false)
  const [recordUploadForm, setRecordUploadForm] = useState({
    title: '',
    type: 'lab_report',
    date_recorded: new Date().toISOString().slice(0, 10),
    file: null as File | null
  })

  // Book Appointment state
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [doctorResults, setDoctorResults] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookingType, setBookingType] = useState('consultation')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingError, setBookingError] = useState('')

  // Cancel/Reschedule state
  const [cancellingAppointment, setCancellingAppointment] = useState<any>(null)
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([])
  const [rescheduleSlot, setRescheduleSlot] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [appointmentActionError, setAppointmentActionError] = useState('')

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [insightsCached, setInsightsCached] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [insightsGeneratedAt, setInsightsGeneratedAt] = useState<string | null>(null)

  // Family member integration state
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<any>(null)
  const [familyMemberData, setFamilyMemberData] = useState<{ member: any; vitals: any[]; appointments: any[]; insights: any[] } | null>(null)
  const [isFamilyDataLoading, setIsFamilyDataLoading] = useState(false)
  const [bookingForMember, setBookingForMember] = useState('')
  const [vitalsForMember, setVitalsForMember] = useState('')
  const [familyInsights, setFamilyInsights] = useState<AIInsight[]>([])
  const [isGeneratingFamilyInsights, setIsGeneratingFamilyInsights] = useState(false)
  const [familyInsightsError, setFamilyInsightsError] = useState('')

  // Redirect unauthenticated users after auth finishes loading
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      const [
        recordsResult,
        appointmentsResult,
        vitalsResult,
        familyResult,
        walletSummaryResult
      ] = await Promise.all([
        fetch(`/api/health-records?action=get-records&userId=${user.id}`).then(res => res.json()),
        fetch(`/api/appointments?action=upcoming&userId=${user.id}&userType=patient`).then(res => res.json()),
        fetch(`/api/vital-signs?action=latest-readings&userId=${user.id}`).then(res => res.json()),
        fetch(`/api/family-members?userId=${user.id}`).then(res => res.json()),
        fetch(`/api/health-wallet?action=get-summary&userId=${user.id}&months=1`).then(res => res.json())
      ])

      setDashboardData({
        healthRecords: recordsResult.data || [],
        upcomingAppointments: appointmentsResult.data || [],
        latestVitals: vitalsResult.data || [],
        familyMembers: familyResult.data || [],
        loading: false
      })
      setWalletSummary(walletSummaryResult?.success ? walletSummaryResult.data : null)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDashboardData({
        healthRecords: [],
        upcomingAppointments: [],
        latestVitals: [],
        familyMembers: [],
        loading: false
      })
      setWalletSummary(null)
    }
  }

  // Load cached AI insights on dashboard load
  useEffect(() => {
    if (user) {
      loadAIInsights()
    }
  }, [user])

  const loadAIInsights = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/ai/patient/insights?user_id=${user.id}`).then(r => r.json())
      if (res.success && res.insights?.length > 0) {
        setAiInsights(res.insights)
        setInsightsCached(res.cached || false)
        setInsightsGeneratedAt(res.generated_at || null)
      }
    } catch {
      // Silently fail — insights are optional
    }
  }

  const generateAIInsights = async () => {
    if (!user || isGeneratingInsights) return
    setIsGeneratingInsights(true)
    setInsightsError('')
    try {
      const res = await fetch('/api/ai/patient/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      }).then(r => r.json())

      if (res.success && res.insights?.length > 0) {
        setAiInsights(res.insights)
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

  const loadFamilyMemberData = async (memberId: string) => {
    if (!user) return
    setIsFamilyDataLoading(true)
    try {
      const [healthRes, insightsRes] = await Promise.all([
        fetch(`/api/family-members?action=health-data&userId=${user.id}&memberId=${memberId}`).then(r => r.json()),
        fetch(`/api/ai/patient/insights/family?user_id=${user.id}&family_member_id=${memberId}`).then(r => r.json()),
      ])
      if (healthRes.success) setFamilyMemberData(healthRes.data)
      if (insightsRes.success && insightsRes.insights?.length > 0) {
        setFamilyInsights(insightsRes.insights)
      } else {
        setFamilyInsights([])
      }
    } catch { setFamilyMemberData(null); setFamilyInsights([]) }
    finally { setIsFamilyDataLoading(false) }
  }

  const generateFamilyInsights = async (memberId: string) => {
    if (!user || isGeneratingFamilyInsights) return
    setIsGeneratingFamilyInsights(true)
    setFamilyInsightsError('')
    try {
      const res = await fetch('/api/ai/patient/insights/family/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, family_member_id: memberId })
      }).then(r => r.json())
      if (res.success && res.insights?.length > 0) {
        setFamilyInsights(res.insights)
      } else {
        setFamilyInsightsError(res.error || 'Failed to generate insights')
      }
    } catch {
      setFamilyInsightsError('AI service unavailable.')
    } finally { setIsGeneratingFamilyInsights(false) }
  }

  const searchDoctors = async (query: string) => {
    if (!query.trim()) { setDoctorResults([]); return }
    try {
      const res = await fetch(`/api/doctors?action=search&q=${encodeURIComponent(query)}`).then(r => r.json())
      setDoctorResults(res.data || [])
    } catch { setDoctorResults([]) }
  }

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return
    setAvailableSlots([])
    setSelectedSlot('')
    try {
      const res = await fetch(`/api/appointments?action=available-slots&doctorId=${doctorId}&date=${date}`).then(r => r.json())
      setAvailableSlots(res.data || [])
    } catch { setAvailableSlots([]) }
  }

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !bookingDate || !selectedSlot) {
      setBookingError('Please select a doctor, date, and time slot.')
      return
    }
    setBookingError('')
    setIsBooking(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          appointmentData: {
            patient_id: user!.id,
            doctor_id: selectedDoctor.id,
            family_member_id: (bookingForMember && bookingForMember !== 'self') ? bookingForMember : null,
            appointment_date: bookingDate,
            appointment_time: `${selectedSlot}:00`,
            type: bookingType,
            reason: bookingNotes || 'General consultation',
            notes: bookingNotes || null,
            status: 'scheduled',
          }
        })
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Booking failed')
      setIsBookingOpen(false)
      setSelectedDoctor(null)
      setDoctorSearch('')
      setDoctorResults([])
      setBookingDate('')
      setAvailableSlots([])
      setSelectedSlot('')
      setBookingNotes('')
      setBookingForMember('')
      loadDashboardData()
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment')
    } finally {
      setIsBooking(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!cancellingAppointment || !cancelReason.trim()) {
      setAppointmentActionError('Please provide a reason for cancellation.')
      return
    }
    setIsCancelling(true)
    setAppointmentActionError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          appointmentId: cancellingAppointment.id,
          reason: cancelReason,
        })
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Failed to cancel')
      setCancellingAppointment(null)
      setCancelReason('')
      loadDashboardData()
    } catch (err: any) {
      setAppointmentActionError(err.message || 'Failed to cancel appointment')
    } finally {
      setIsCancelling(false)
    }
  }

  const loadRescheduleSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return
    setRescheduleSlots([])
    setRescheduleSlot('')
    try {
      const res = await fetch(`/api/appointments?action=available-slots&doctorId=${doctorId}&date=${date}`).then(r => r.json())
      setRescheduleSlots(res.data || [])
    } catch { setRescheduleSlots([]) }
  }

  const handleRescheduleAppointment = async () => {
    if (!reschedulingAppointment || !rescheduleDate || !rescheduleSlot) {
      setAppointmentActionError('Please select a new date and time slot.')
      return
    }
    if (!rescheduleReason.trim()) {
      setAppointmentActionError('Please provide a reason for rescheduling.')
      return
    }
    setIsRescheduling(true)
    setAppointmentActionError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          appointmentId: reschedulingAppointment.id,
          newDate: rescheduleDate,
          newTime: `${rescheduleSlot}:00`,
          reason: rescheduleReason,
        })
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Failed to reschedule')
      setReschedulingAppointment(null)
      setRescheduleReason('')
      setRescheduleDate('')
      setRescheduleSlots([])
      setRescheduleSlot('')
      loadDashboardData()
    } catch (err: any) {
      setAppointmentActionError(err.message || 'Failed to reschedule appointment')
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const addVitalSign = async () => {
    if (!vitalValue.trim() || !user) return

    setIsAddingVital(true)
    try {
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitalData: {
            user_id: user.id,
            family_member_id: (vitalsForMember && vitalsForMember !== 'self') ? vitalsForMember : null,
            type: selectedVital,
            value: vitalValue.trim(),
            unit: getVitalUnit(selectedVital)
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setVitalValue('')
        await loadDashboardData() // Refresh data
        
        if (result.abnormal?.isAbnormal) {
          const severityLabel = result.abnormal.severity === 'high' ? '🔴 URGENT' : result.abnormal.severity === 'medium' ? '🟡 Warning' : '🟢 Notice'
          alert(`${severityLabel}: ${result.abnormal.message}`)
        }
      }
    } catch (error) {
      console.error('Error adding vital sign:', error)
    } finally {
      setIsAddingVital(false)
    }
  }

  const addFamilyMember = async () => {
    if (!familyMemberForm.name.trim() || !familyMemberForm.relationship || !familyMemberForm.date_of_birth || !familyMemberForm.gender || !user) return

    setIsAddingFamily(true)
    try {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberData: {
            user_id: user.id,
            full_name: familyMemberForm.name.trim(),
            relationship: familyMemberForm.relationship,
            date_of_birth: familyMemberForm.date_of_birth,
            gender: familyMemberForm.gender,
            phone: familyMemberForm.phone.trim() || null,
            emergency_contact: familyMemberForm.emergency_contact
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setFamilyMemberForm({ 
          name: '', 
          relationship: '', 
          date_of_birth: '', 
          gender: '', 
          phone: '', 
          emergency_contact: false 
        })
        setIsAddFamilyModalOpen(false)
        await loadDashboardData() // Refresh data
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding family member:', error)
      alert('Failed to add family member. Please try again.')
    } finally {
      setIsAddingFamily(false)
    }
  }

  const uploadHealthRecord = async () => {
    if (!user || !recordUploadForm.title.trim() || !recordUploadForm.file) return

    setIsUploadingRecord(true)
    try {
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('title', recordUploadForm.title.trim())
      formData.append('type', recordUploadForm.type)
      formData.append('date_recorded', recordUploadForm.date_recorded)
      formData.append('file', recordUploadForm.file)

      const response = await fetch('/api/health-records', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload health record')
      }

      setRecordUploadForm({
        title: '',
        type: 'lab_report',
        date_recorded: new Date().toISOString().slice(0, 10),
        file: null
      })
      setIsUploadModalOpen(false)
      await loadDashboardData()
      alert('Health record uploaded successfully')
    } catch (error) {
      console.error('Error uploading health record:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload health record. Please try again.')
    } finally {
      setIsUploadingRecord(false)
    }
  }

  const getVitalUnit = (type: string) => {
    const units: { [key: string]: string } = {
      'blood_pressure': 'mmHg',
      'heart_rate': 'bpm',
      'temperature': '°F',
      'weight': 'lbs',
      'blood_sugar': 'mg/dL'
    }
    return units[type] || ''
  }

  const getVitalPlaceholder = (type: string) => {
    const placeholders: { [key: string]: string } = {
      'blood_pressure': '120/80',
      'heart_rate': '72',
      'temperature': '98.6',
      'weight': '150',
      'blood_sugar': '100'
    }
    return placeholders[type] || ''
  }

  const getLatestVitalValue = (type: string) => {
    const vital = dashboardData.latestVitals.find(v => v.type === type)
    return vital?.data ? `${vital.data.value} ${vital.data.unit}` : 'No data'
  }

  const getLatestVitalDate = (type: string) => {
    const vital = dashboardData.latestVitals.find(v => v.type === type)
    return vital?.data ? new Date(vital.data.recorded_at).toLocaleDateString() : ''
  }

  const getUserInitials = () => {
    if (!user?.full_name) return 'U'
    return user.full_name
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const calculateHealthScore = () => {
    const getVitalData = (type: string) => {
      const vital = dashboardData.latestVitals.find(v => v.type === type)
      return vital?.data?.value || null
    }

    // Vital health scoring (0-20 each, up to 80 total)
    let vitalScore = 0
    let vitalCount = 0

    // Blood Pressure: ideal 90-120 / 60-80
    const bp = getVitalData('blood_pressure')
    if (bp && bp.includes('/')) {
      vitalCount++
      const [sys, dia] = bp.split('/').map(Number)
      if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) vitalScore += 20
      else if (sys >= 80 && sys <= 130 && dia >= 55 && dia <= 85) vitalScore += 15
      else if (sys >= 70 && sys <= 140 && dia >= 50 && dia <= 90) vitalScore += 10
      else vitalScore += 5
    }

    // Heart Rate: ideal 60-100 bpm
    const hr = getVitalData('heart_rate')
    if (hr) {
      vitalCount++
      const hrVal = parseFloat(hr)
      if (hrVal >= 60 && hrVal <= 100) vitalScore += 20
      else if (hrVal >= 50 && hrVal <= 110) vitalScore += 15
      else if (hrVal >= 40 && hrVal <= 120) vitalScore += 10
      else vitalScore += 5
    }

    // Temperature: ideal 97.0-99.0 °F
    const temp = getVitalData('temperature')
    if (temp) {
      vitalCount++
      const tempVal = parseFloat(temp)
      if (tempVal >= 97.0 && tempVal <= 99.0) vitalScore += 20
      else if (tempVal >= 96.0 && tempVal <= 100.0) vitalScore += 15
      else if (tempVal >= 95.0 && tempVal <= 101.0) vitalScore += 10
      else vitalScore += 5
    }

    // Weight: award points just for tracking (no universal healthy range)
    const weight = getVitalData('weight')
    if (weight) {
      vitalCount++
      vitalScore += 15
    }

    // If no vitals recorded, base vital score is 0
    // Normalize vital score to 0-70 range
    const normalizedVitalScore = vitalCount > 0
      ? Math.round((vitalScore / (vitalCount * 20)) * 70)
      : 0

    // Engagement scoring (up to 30)
    const hasRecords = dashboardData.healthRecords.length > 0 ? 10 : 0
    const hasAppointments = dashboardData.upcomingAppointments.length > 0 ? 10 : 0
    const tracksVitals = vitalCount >= 3 ? 10 : vitalCount >= 1 ? 5 : 0

    const total = normalizedVitalScore + hasRecords + hasAppointments + tracksVitals
    return Math.min(Math.max(total, 0), 100)
  }

  if (authLoading || dashboardData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">Welcome back, {user?.full_name || 'User'}!</h1>
                <p className="text-sm text-muted-foreground">Here's your health overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                {dashboardData.upcomingAppointments.length > 0 && (
                  <Badge className="ml-1 h-4 w-4 rounded-full p-0 text-xs">
                    {dashboardData.upcomingAppointments.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Family Members</p>
                    <p className="text-2xl font-bold">{dashboardData.familyMembers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
                    <p className="text-2xl font-bold">{dashboardData.upcomingAppointments.length}</p>
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
                    <p className="text-sm text-muted-foreground">Health Records</p>
                    <p className="text-2xl font-bold">{dashboardData.healthRecords.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Health Score</p>
                    <p className="text-2xl font-bold text-green-600">{calculateHealthScore()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Family Profiles */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Family Profiles</CardTitle>
                    <CardDescription>Manage health records for your family</CardDescription>
                  </div>
                  <Dialog open={isAddFamilyModalOpen} onOpenChange={setIsAddFamilyModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Family Member</DialogTitle>
                        <DialogDescription>
                          Add a family member to manage their health records together.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={familyMemberForm.name}
                            onChange={(e) => setFamilyMemberForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="relationship">Relationship *</Label>
                          <Select 
                            value={familyMemberForm.relationship} 
                            onValueChange={(value) => setFamilyMemberForm(prev => ({ ...prev, relationship: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="grandparent">Grandparent</SelectItem>
                              <SelectItem value="grandchild">Grandchild</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="date_of_birth">Date of Birth *</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={familyMemberForm.date_of_birth}
                            onChange={(e) => setFamilyMemberForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gender">Gender *</Label>
                          <Select 
                            value={familyMemberForm.gender} 
                            onValueChange={(value) => setFamilyMemberForm(prev => ({ ...prev, gender: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={familyMemberForm.phone}
                            onChange={(e) => setFamilyMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            id="emergency_contact"
                            type="checkbox"
                            checked={familyMemberForm.emergency_contact}
                            onChange={(e) => setFamilyMemberForm(prev => ({ ...prev, emergency_contact: e.target.checked }))}
                          />
                          <Label htmlFor="emergency_contact">Emergency Contact</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddFamilyModalOpen(false)} disabled={isAddingFamily}>
                          Cancel
                        </Button>
                        <Button onClick={addFamilyMember} disabled={isAddingFamily || !familyMemberForm.name.trim() || !familyMemberForm.relationship || !familyMemberForm.date_of_birth || !familyMemberForm.gender}>
                          {isAddingFamily ? 'Adding...' : 'Add Member'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {dashboardData.familyMembers.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {dashboardData.familyMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="text-center p-4 border rounded-lg card-hover cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                          onClick={() => { setSelectedFamilyMember(member); loadFamilyMemberData(member.id) }}
                        >
                          <Avatar className="h-12 w-12 mx-auto mb-2">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.full_name?.charAt(0)?.toUpperCase() || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm">{member.full_name || 'Family Member'}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.date_of_birth ?
                              `${new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()} years` :
                              'Age not set'}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.relationship}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">No family members added yet</p>
                      <Button className="mt-4" size="sm" onClick={() => setIsAddFamilyModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Family Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vitals Tracking */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Vital Signs Tracking</CardTitle>
                      <CardDescription>Monitor your health metrics over time</CardDescription>
                    </div>
                    {dashboardData.familyMembers.length > 0 && (
                      <Select value={vitalsForMember} onValueChange={setVitalsForMember}>
                        <SelectTrigger className="w-[180px] text-xs h-8"><SelectValue placeholder="Logging for: Myself" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Myself</SelectItem>
                          {dashboardData.familyMembers.map((fm: any) => (
                            <SelectItem key={fm.id} value={fm.id}>{fm.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="blood-pressure" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="blood-pressure">BP</TabsTrigger>
                      <TabsTrigger value="heart-rate">HR</TabsTrigger>
                      <TabsTrigger value="weight">Weight</TabsTrigger>
                      <TabsTrigger value="temperature">Temp</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="blood-pressure" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          <span className="font-medium">Blood Pressure</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="120/80"
                            value={selectedVital === 'blood_pressure' ? vitalValue : ''}
                            onChange={(e) => {
                              setSelectedVital('blood_pressure')
                              setVitalValue(e.target.value)
                            }}
                            className="px-2 py-1 text-sm border rounded"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedVital('blood_pressure')
                              addVitalSign()
                            }}
                            disabled={isAddingVital}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {isAddingVital ? 'Adding...' : 'Log'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Latest Reading</p>
                          <p className="text-xl font-bold">{getLatestVitalValue('blood_pressure')}</p>
                          <p className="text-xs text-muted-foreground">{getLatestVitalDate('blood_pressure')}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-xl font-bold">
                            {getLatestVitalValue('blood_pressure') !== 'No data' ? 'Normal' : 'No Data'}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="heart-rate">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-red-500" />
                            <span className="font-medium">Heart Rate</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="72"
                              value={selectedVital === 'heart_rate' ? vitalValue : ''}
                              onChange={(e) => {
                                setSelectedVital('heart_rate')
                                setVitalValue(e.target.value)
                              }}
                              className="px-2 py-1 text-sm border rounded"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVital('heart_rate')
                                addVitalSign()
                              }}
                              disabled={isAddingVital}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Log
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Latest Reading</p>
                          <p className="text-xl font-bold">{getLatestVitalValue('heart_rate')}</p>
                          <p className="text-xs text-muted-foreground">{getLatestVitalDate('heart_rate')}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="weight">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Weight className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Weight (in lbs)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="150"
                              value={selectedVital === 'weight' ? vitalValue : ''}
                              onChange={(e) => {
                                setSelectedVital('weight')
                                setVitalValue(e.target.value)
                              }}
                              className="px-2 py-1 text-sm border rounded"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVital('weight')
                                addVitalSign()
                              }}
                              disabled={isAddingVital}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Log
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Current Weight</p>
                          <p className="text-xl font-bold">{getLatestVitalValue('weight')}</p>
                          <p className="text-xs text-muted-foreground">{getLatestVitalDate('weight')}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="temperature">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">Temperature</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="98.6"
                              value={selectedVital === 'temperature' ? vitalValue : ''}
                              onChange={(e) => {
                                setSelectedVital('temperature')
                                setVitalValue(e.target.value)
                              }}
                              className="px-2 py-1 text-sm border rounded"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVital('temperature')
                                addVitalSign()
                              }}
                              disabled={isAddingVital}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Log
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Latest Reading</p>
                          <p className="text-xl font-bold">{getLatestVitalValue('temperature')}</p>
                          <p className="text-xs text-muted-foreground">{getLatestVitalDate('temperature')}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Recent Health Records */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Health Records</CardTitle>
                    <CardDescription>Your latest medical documents</CardDescription>
                  </div>
                  <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Upload Health Record</DialogTitle>
                        <DialogDescription>
                          Upload PDF, image, or Word documents to your secure health records.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                          <Label htmlFor="record-title">Title *</Label>
                          <Input
                            id="record-title"
                            value={recordUploadForm.title}
                            onChange={(e) => setRecordUploadForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Blood Test - Jan 2026"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="record-type">Record Type *</Label>
                          <Select
                            value={recordUploadForm.type}
                            onValueChange={(value) => setRecordUploadForm(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger id="record-type">
                              <SelectValue placeholder="Select record type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lab_report">Lab Report</SelectItem>
                              <SelectItem value="prescription">Prescription</SelectItem>
                              <SelectItem value="xray">X-Ray</SelectItem>
                              <SelectItem value="scan">Scan</SelectItem>
                              <SelectItem value="consultation">Consultation</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="record-date">Record Date *</Label>
                          <Input
                            id="record-date"
                            type="date"
                            value={recordUploadForm.date_recorded}
                            onChange={(e) => setRecordUploadForm(prev => ({ ...prev, date_recorded: e.target.value }))}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="record-file">File *</Label>
                          <Input
                            id="record-file"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                            onChange={(e) => {
                              const selectedFile = e.target.files?.[0] || null
                              setRecordUploadForm(prev => ({ ...prev, file: selectedFile }))
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Allowed: PDF, PNG, JPG, WEBP, DOC, DOCX (max 10MB)
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsUploadModalOpen(false)}
                          disabled={isUploadingRecord}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={uploadHealthRecord}
                          disabled={
                            isUploadingRecord ||
                            !recordUploadForm.title.trim() ||
                            !recordUploadForm.file
                          }
                        >
                          {isUploadingRecord ? 'Uploading...' : 'Upload Record'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {dashboardData.healthRecords.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.healthRecords.slice(0, 4).map((record: any) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg card-hover cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{record.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.date_recorded).toLocaleDateString()} • {record.type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {record.type.replace('_', ' ')}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (record.file_url) {
                                  window.open(record.file_url, '_blank', 'noopener,noreferrer')
                                }
                              }}
                              disabled={!record.file_url}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">No health records yet</p>
                      <Button className="mt-4" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload First Record
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* AI Health Insights */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      <CardTitle>AI Health Insights</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant={aiInsights.length > 0 ? "outline" : "default"}
                      onClick={generateAIInsights}
                      disabled={isGeneratingInsights}
                      className="text-xs"
                    >
                      {isGeneratingInsights ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Analyzing...
                        </>
                      ) : aiInsights.length > 0 ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    {insightsGeneratedAt
                      ? `Last updated: ${new Date(insightsGeneratedAt).toLocaleString()}`
                      : 'AI-powered insights from your health data'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insightsError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">{insightsError}</p>
                    </div>
                  )}

                  {aiInsights.length > 0 ? (
                    aiInsights.map((insight, idx) => {
                      const severityConfig: Record<string, { border: string; icon: React.ReactNode }> = {
                        low: { border: 'border-l-green-500', icon: <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> },
                        medium: { border: 'border-l-yellow-500', icon: <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" /> },
                        high: { border: 'border-l-orange-500', icon: <ShieldAlert className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" /> },
                        critical: { border: 'border-l-red-500', icon: <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> },
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
                        Click &quot;Generate&quot; to get AI-powered health insights
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on your vitals, appointments, and prescriptions
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Analyzing your health data...
                      </p>
                    </div>
                  )}

                  {insightsCached && aiInsights.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Showing cached insights. Click Refresh for latest analysis.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled visits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.upcomingAppointments.length > 0 ? (
                    <>
                      {dashboardData.upcomingAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                Dr. {appointment.doctors?.users?.full_name || 'Doctor'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {appointment.doctors?.specialty || 'General'}
                                {appointment.doctors?.hospitals?.name && ` • ${appointment.doctors.hospitals.name}`}
                              </p>
                              {appointment.family_members?.full_name && (
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  For: {appointment.family_members.full_name} ({appointment.family_members.relationship})
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointment_time}
                            </div>
                            <Badge variant="outline" className={`text-xs ${
                              appointment.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              appointment.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                              appointment.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              appointment.status === 'completed' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                              appointment.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                              ''
                            }`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'in_progress' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => { setReschedulingAppointment(appointment); setAppointmentActionError(''); setRescheduleDate(''); setRescheduleSlots([]); setRescheduleSlot(''); setRescheduleReason('') }}
                              >
                                <CalendarClock className="mr-1 h-3 w-3" /> Reschedule
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => { setCancellingAppointment(appointment); setAppointmentActionError(''); setCancelReason('') }}
                              >
                                <XCircle className="mr-1 h-3 w-3" /> Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No upcoming appointments</p>
                    </div>
                  )}
                  <Dialog open={isBookingOpen} onOpenChange={(open) => { setIsBookingOpen(open); if (!open) { setBookingError(''); setSelectedDoctor(null); setDoctorSearch(''); setDoctorResults([]); setBookingDate(''); setAvailableSlots([]); setSelectedSlot(''); setBookingNotes(''); setBookingForMember('') } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Book New Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                        <DialogDescription>Search for a doctor and pick a time slot.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Booking for selector */}
                        {dashboardData.familyMembers.length > 0 && (
                          <div>
                            <Label>Booking for</Label>
                            <Select value={bookingForMember} onValueChange={setBookingForMember}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Myself" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="self">Myself</SelectItem>
                                {dashboardData.familyMembers.map((fm: any) => (
                                  <SelectItem key={fm.id} value={fm.id}>
                                    {fm.full_name} ({fm.relationship})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Doctor search */}
                        <div>
                          <Label>Search Doctor</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Name or specialty..."
                              value={doctorSearch}
                              onChange={(e) => setDoctorSearch(e.target.value)}
                            />
                            <Button size="sm" variant="outline" onClick={() => searchDoctors(doctorSearch)}>Search</Button>
                          </div>
                          {doctorResults.length > 0 && !selectedDoctor && (
                            <div className="border rounded-lg mt-1 divide-y max-h-40 overflow-y-auto">
                              {doctorResults.map((doc: any) => (
                                <button
                                  key={doc.id}
                                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
                                  onClick={() => { setSelectedDoctor(doc); setDoctorResults([]); if (bookingDate) loadAvailableSlots(doc.id, bookingDate) }}
                                >
                                  <span className="font-medium">Dr. {doc.users?.full_name || doc.user_id}</span>
                                  <span className="text-muted-foreground ml-2">{doc.specialty}</span>
                                  {doc.hospitals?.name && <span className="text-muted-foreground ml-2">• {doc.hospitals.name}</span>}
                                  {doc.consultation_fee && <span className="text-muted-foreground ml-2">₹{doc.consultation_fee}</span>}
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedDoctor && (
                            <div className="mt-1 p-2 bg-primary/5 border border-primary/20 rounded-lg flex justify-between items-center">
                              <span className="text-sm font-medium">Dr. {selectedDoctor.users?.full_name} — {selectedDoctor.specialty}{selectedDoctor.hospitals?.name ? ` • ${selectedDoctor.hospitals.name}` : ''}</span>
                              <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setSelectedDoctor(null); setAvailableSlots([]); setSelectedSlot('') }}>✕ Change</button>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            className="mt-1"
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingDate}
                            onChange={(e) => { setBookingDate(e.target.value); if (selectedDoctor) loadAvailableSlots(selectedDoctor.id, e.target.value) }}
                          />
                        </div>

                        {/* Time slot */}
                        {availableSlots.length > 0 && (
                          <div>
                            <Label>Time Slot</Label>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                              {availableSlots.map(slot => (
                                <button
                                  key={slot}
                                  className={`text-xs py-1.5 px-2 rounded border transition-colors ${selectedSlot === slot ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50'}`}
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedDoctor && bookingDate && availableSlots.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">No available slots for this date.</p>
                        )}

                        {/* Type */}
                        <div>
                          <Label>Type</Label>
                          <Select value={bookingType} onValueChange={setBookingType}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="consultation">Consultation</SelectItem>
                              <SelectItem value="follow_up">Follow-up</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="telemedicine">Telemedicine</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label>Notes (optional)</Label>
                          <Input
                            className="mt-1"
                            placeholder="Reason for visit..."
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                          />
                        </div>

                        {bookingError && <p className="text-sm text-destructive">{bookingError}</p>}

                        <Button className="w-full" onClick={handleBookAppointment} disabled={isBooking}>
                          {isBooking ? 'Booking...' : 'Confirm Appointment'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Cancel Appointment Dialog */}
                  <Dialog open={!!cancellingAppointment} onOpenChange={(open) => { if (!open) { setCancellingAppointment(null); setCancelReason(''); setAppointmentActionError('') } }}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Cancel Appointment</DialogTitle>
                        <DialogDescription>
                          This will cancel your appointment with Dr. {cancellingAppointment?.doctors?.users?.full_name || 'Doctor'} on {cancellingAppointment?.appointment_date} at {cancellingAppointment?.appointment_time}. The doctor will be notified.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Reason for cancellation <span className="text-destructive">*</span></Label>
                          <Input
                            className="mt-1"
                            placeholder="Please provide a reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                        </div>
                        {appointmentActionError && <p className="text-sm text-destructive">{appointmentActionError}</p>}
                        <div className="flex gap-2">
                          <Button variant="destructive" className="flex-1" onClick={handleCancelAppointment} disabled={isCancelling}>
                            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => setCancellingAppointment(null)}>
                            Go Back
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Reschedule Appointment Dialog */}
                  <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => { if (!open) { setReschedulingAppointment(null); setRescheduleReason(''); setRescheduleDate(''); setRescheduleSlots([]); setRescheduleSlot(''); setAppointmentActionError('') } }}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>
                          Current: Dr. {reschedulingAppointment?.doctors?.users?.full_name || 'Doctor'} on {reschedulingAppointment?.appointment_date} at {reschedulingAppointment?.appointment_time}. Pick a new date and time.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>New Date</Label>
                          <Input
                            type="date"
                            className="mt-1"
                            min={new Date().toISOString().split('T')[0]}
                            value={rescheduleDate}
                            onChange={(e) => {
                              setRescheduleDate(e.target.value)
                              if (reschedulingAppointment?.doctors?.id) {
                                loadRescheduleSlots(reschedulingAppointment.doctors.id, e.target.value)
                              }
                            }}
                          />
                        </div>

                        {rescheduleSlots.length > 0 && (
                          <div>
                            <Label>New Time Slot</Label>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                              {rescheduleSlots.map(slot => (
                                <button
                                  key={slot}
                                  className={`text-xs py-1.5 px-2 rounded border transition-colors ${rescheduleSlot === slot ? 'bg-primary text-white border-primary' : 'hover:bg-muted/50'}`}
                                  onClick={() => setRescheduleSlot(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {reschedulingAppointment && rescheduleDate && rescheduleSlots.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">No available slots for this date.</p>
                        )}

                        <div>
                          <Label>Reason for rescheduling <span className="text-destructive">*</span></Label>
                          <Input
                            className="mt-1"
                            placeholder="Please provide a reason..."
                            value={rescheduleReason}
                            onChange={(e) => setRescheduleReason(e.target.value)}
                          />
                        </div>

                        {appointmentActionError && <p className="text-sm text-destructive">{appointmentActionError}</p>}
                        <Button className="w-full" onClick={handleRescheduleAppointment} disabled={isRescheduling}>
                          {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Health Wallet */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle>Health Wallet</CardTitle>
                  </div>
                  <CardDescription>Track your medical expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(walletSummary?.totalExpenses || 0)}
                    </p>
                    <p className="text-xs text-green-600">
                      {walletSummary ? `${walletSummary.transactionCount} transactions recorded` : 'No wallet transactions yet'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consultations</span>
                      <span>{formatCurrency(walletSummary?.byCategory?.Consultation || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Lab Tests</span>
                      <span>{formatCurrency(walletSummary?.byCategory?.['Lab Tests'] || 0)}</span>
                    </div>
                  </div>
                  <Link href="/patient/wallet">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/patient/prescriptions">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Pill className="h-4 w-4 mr-2" />
                      View Prescriptions
                    </Button>
                  </Link>
                  <Link href="/patient/reminders">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Smart Reminders
                    </Button>
                  </Link>
                  <Link href="/patient/wallet">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Wallet className="h-4 w-4 mr-2" />
                      Health Wallet
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/patient/sos')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Family Member Detail Sheet */}
      <Sheet open={!!selectedFamilyMember} onOpenChange={(open) => { if (!open) { setSelectedFamilyMember(null); setFamilyMemberData(null); setFamilyInsights([]); setFamilyInsightsError('') } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{selectedFamilyMember?.full_name?.charAt(0)?.toUpperCase() || 'F'}</AvatarFallback>
              </Avatar>
              {selectedFamilyMember?.full_name || 'Family Member'}
            </SheetTitle>
            <SheetDescription>
              {selectedFamilyMember?.relationship} {selectedFamilyMember?.date_of_birth ? `• ${new Date().getFullYear() - new Date(selectedFamilyMember.date_of_birth).getFullYear()} years` : ''}
              {selectedFamilyMember?.gender ? ` • ${selectedFamilyMember.gender}` : ''}
            </SheetDescription>
          </SheetHeader>

          {isFamilyDataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading health data...</span>
            </div>
          ) : (
            <Tabs defaultValue="vitals" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vitals">Vitals</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Vitals Tab */}
              <TabsContent value="vitals" className="space-y-3 mt-3">
                {familyMemberData?.vitals && familyMemberData.vitals.length > 0 ? (
                  familyMemberData.vitals.map((vital: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {vital.type === 'blood_pressure' && <Heart className="h-4 w-4 text-red-500" />}
                        {vital.type === 'heart_rate' && <Activity className="h-4 w-4 text-pink-500" />}
                        {vital.type === 'temperature' && <Thermometer className="h-4 w-4 text-orange-500" />}
                        {vital.type === 'weight' && <Weight className="h-4 w-4 text-blue-500" />}
                        {!['blood_pressure', 'heart_rate', 'temperature', 'weight'].includes(vital.type) && <Activity className="h-4 w-4 text-gray-500" />}
                        <div>
                          <p className="text-sm font-medium capitalize">{vital.type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(vital.recorded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{vital.value} {vital.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-muted-foreground">No vitals recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the "Logging for" selector in Vital Signs to log vitals for {selectedFamilyMember?.full_name}</p>
                  </div>
                )}
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-3 mt-3">
                {familyMemberData?.appointments && familyMemberData.appointments.length > 0 ? (
                  familyMemberData.appointments.map((appt: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">
                            Dr. {appt.doctors?.users?.full_name || 'Doctor'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appt.doctors?.specialty || 'General'}
                            {appt.hospitals?.name && ` • ${appt.hospitals.name}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${
                          appt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                          appt.status === 'completed' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                          appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          ''
                        }`}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(appt.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appt.appointment_time}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-muted-foreground">No appointments yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use "Booking for" when booking a new appointment to schedule for {selectedFamilyMember?.full_name}</p>
                  </div>
                )}
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => selectedFamilyMember && generateFamilyInsights(selectedFamilyMember.id)}
                  disabled={isGeneratingFamilyInsights}
                >
                  {isGeneratingFamilyInsights ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> {familyInsights.length > 0 ? 'Refresh Insights' : 'Generate AI Insights'}</>
                  )}
                </Button>
                {familyInsightsError && (
                  <p className="text-sm text-destructive text-center">{familyInsightsError}</p>
                )}
                {familyInsights.length > 0 ? (
                  familyInsights.map((insight: any, i: number) => (
                    <div key={i} className={`p-3 border rounded-lg ${
                      insight.severity === 'critical' ? 'border-red-300 bg-red-50' :
                      insight.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                      insight.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                      'border-green-300 bg-green-50'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`h-4 w-4 mt-0.5 ${
                          insight.severity === 'critical' ? 'text-red-600' :
                          insight.severity === 'high' ? 'text-orange-600' :
                          insight.severity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          {insight.recommendation && (
                            <p className="text-xs mt-1.5 font-medium text-primary">{insight.recommendation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : !isGeneratingFamilyInsights && !familyInsightsError && (
                  <div className="text-center py-6">
                    <Brain className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-muted-foreground">No insights yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Generate AI Insights" to get health analysis for {selectedFamilyMember?.full_name}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}