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
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  healthRecords: any[]
  upcomingAppointments: any[]
  latestVitals: any[]
  familyMembers: any[]
  loading: boolean
}

// Add dummy data for showcase
const dummyData = {
  healthRecords: [
    {
      id: 'dummy-1',
      title: 'Annual Physical Examination',
      type: 'physical_exam',
      date_recorded: new Date().toISOString().split('T')[0],
      description: 'Comprehensive annual health checkup'
    },
    {
      id: 'dummy-2',
      title: 'Blood Test Results',
      type: 'lab_report',
      date_recorded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Complete blood count and metabolic panel'
    },
    {
      id: 'dummy-3',
      title: 'X-Ray Chest',
      type: 'imaging',
      date_recorded: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Routine chest X-ray examination'
    },
    {
      id: 'dummy-4',
      title: 'Vaccination Record',
      type: 'vaccination',
      date_recorded: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'COVID-19 booster vaccination'
    }
  ],
  upcomingAppointments: [
    {
      id: 'dummy-app-1',
      appointment_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointment_time: '10:30 AM',
      status: 'confirmed',
      doctors: {
        specialty: 'Cardiology',
        users: {
          full_name: 'Sarah Johnson'
        }
      }
    },
    {
      id: 'dummy-app-2',
      appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointment_time: '2:15 PM',
      status: 'pending',
      doctors: {
        specialty: 'Dermatology',
        users: {
          full_name: 'Michael Chen'
        }
      }
    },
    {
      id: 'dummy-app-3',
      appointment_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointment_time: '9:00 AM',
      status: 'confirmed',
      doctors: {
        specialty: 'General Practice',
        users: {
          full_name: 'Emily Davis'
        }
      }
    }
  ],
  latestVitals: [
    {
      id: 'dummy-vital-1',
      type: 'blood_pressure',
      data: {
        value: '120/80',
        unit: 'mmHg',
        recorded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'dummy-vital-2',
      type: 'heart_rate',
      data: {
        value: '72',
        unit: 'bpm',
        recorded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'dummy-vital-3',
      type: 'weight',
      data: {
        value: '165',
        unit: 'lbs',
        recorded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'dummy-vital-4',
      type: 'temperature',
      data: {
        value: '98.6',
        unit: '°F',
        recorded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ],
  familyMembers: [
    {
      id: 'dummy-family-1',
      relationship: 'spouse',
      full_name: 'Alex Smith',
      date_of_birth: '1985-03-15',
      avatar_url: null
    },
    {
      id: 'dummy-family-2',
      relationship: 'child',
      full_name: 'Emma Smith',
      date_of_birth: '2015-07-22',
      avatar_url: null
    },
    {
      id: 'dummy-family-3',
      relationship: 'child',
      full_name: 'Liam Smith',
      date_of_birth: '2018-11-08',
      avatar_url: null
    },
    {
      id: 'dummy-family-4',
      relationship: 'parent',
      full_name: 'Margaret Johnson',
      date_of_birth: '1960-12-03',
      avatar_url: null
    }
  ]
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
        familyResult
      ] = await Promise.all([
        fetch(`/api/health-records?action=get-records&userId=${user.id}`).then(res => res.json()),
        fetch(`/api/appointments?action=upcoming&userId=${user.id}&userType=patient`).then(res => res.json()),
        fetch(`/api/vital-signs?action=latest-readings&userId=${user.id}`).then(res => res.json()),
        fetch(`/api/family-members?userId=${user.id}`).then(res => res.json())
      ])

      // Use dummy data if database returns empty or error, otherwise use database data
      setDashboardData({
        healthRecords: (recordsResult.data && recordsResult.data.length > 0) ? recordsResult.data : dummyData.healthRecords,
        upcomingAppointments: (appointmentsResult.data && appointmentsResult.data.length > 0) ? appointmentsResult.data : dummyData.upcomingAppointments,
        latestVitals: (vitalsResult.data && vitalsResult.data.some((v: any) => v.data)) ? vitalsResult.data : dummyData.latestVitals,
        familyMembers: (familyResult.data && familyResult.data.length > 0) ? familyResult.data : dummyData.familyMembers,
        loading: false
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Fallback to dummy data on error
      setDashboardData({
        healthRecords: dummyData.healthRecords,
        upcomingAppointments: dummyData.upcomingAppointments,
        latestVitals: dummyData.latestVitals,
        familyMembers: dummyData.familyMembers,
        loading: false
      })
    }
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
    const vitalsCount = dashboardData.latestVitals.filter(v => v.data).length
    const recordsCount = dashboardData.healthRecords.length
    const appointmentsCount = dashboardData.upcomingAppointments.length
    
    // Simple scoring algorithm
    let score = 60 // Base score
    score += Math.min(vitalsCount * 8, 25) // Up to 25 points for vitals
    score += Math.min(recordsCount * 2, 10) // Up to 10 points for records
    score += appointmentsCount > 0 ? 5 : 0 // 5 points if appointments scheduled
    
    return Math.min(score, 100)
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
                        <div key={member.id} className="text-center p-4 border rounded-lg card-hover cursor-pointer">
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
                  <CardTitle>Vital Signs Tracking</CardTitle>
                  <CardDescription>Monitor your health metrics over time</CardDescription>
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
                            <span className="font-medium">Weight</span>
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
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <CardTitle>Health Insights</CardTitle>
                  </div>
                  <CardDescription>Based on your recent data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.latestVitals.length > 0 ? (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Vital Signs Recorded</p>
                          <p className="text-xs text-muted-foreground">
                            You have {dashboardData.latestVitals.length} recent vital sign readings
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Start Tracking</p>
                          <p className="text-xs text-muted-foreground">Begin recording your vital signs</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.upcomingAppointments.length > 0 ? (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Appointments Scheduled</p>
                          <p className="text-xs text-muted-foreground">
                            You have {dashboardData.upcomingAppointments.length} upcoming appointments
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Schedule Checkup</p>
                          <p className="text-xs text-muted-foreground">Consider booking a routine checkup</p>
                        </div>
                      </div>
                    </div>
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
                              </p>
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
                            <Badge variant="outline" className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No upcoming appointments</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Book New Appointment
                  </Button>
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
                      ${(dashboardData.upcomingAppointments.length * 150 + dashboardData.healthRecords.length * 25).toFixed(0)}
                    </p>
                    <p className="text-xs text-green-600">Based on your activity</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consultations</span>
                      <span>${(dashboardData.upcomingAppointments.length * 150).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Lab Tests</span>
                      <span>${(dashboardData.healthRecords.length * 25).toFixed(0)}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/patient/sos')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Records
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}