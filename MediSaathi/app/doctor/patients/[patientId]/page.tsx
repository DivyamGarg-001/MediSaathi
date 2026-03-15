'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  Pill,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Heart,
} from 'lucide-react'

type TimelineItem = {
  id: string
  date: string
  type: 'appointment' | 'prescription' | 'record' | 'vital'
  data: any
}

type PatientProfile = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  avatar_url: string | null
  address: string | null
}

export default function PatientHistoryPage() {
  const { user } = useAuth()
  const params = useParams()
  const patientId = params?.patientId as string

  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Resolve doctor ID from user ID
  useEffect(() => {
    if (user) {
      fetch(`/api/doctors?action=get-by-user&userId=${user.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) setDoctorId(result.data.id)
        })
    }
  }, [user])

  const loadTimeline = async () => {
    if (!doctorId || !patientId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/doctors?action=patient-timeline&doctorId=${doctorId}&patientId=${patientId}`)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load patient data')

      const data = result.data
      setProfile(data.profile)

      // Build unified timeline
      const items: TimelineItem[] = []

      data.appointments?.forEach((a: any) => {
        items.push({ id: `apt-${a.id}`, date: a.appointment_date, type: 'appointment', data: a })
      })
      data.prescriptions?.forEach((p: any) => {
        items.push({ id: `rx-${p.id}`, date: p.created_at?.split('T')[0] || '', type: 'prescription', data: p })
      })
      data.healthRecords?.forEach((r: any) => {
        items.push({ id: `rec-${r.id}`, date: r.date_recorded, type: 'record', data: r })
      })
      data.vitalSigns?.forEach((v: any) => {
        items.push({ id: `vs-${v.id}`, date: v.recorded_at?.split('T')[0] || '', type: 'vital', data: v })
      })

      items.sort((a, b) => b.date.localeCompare(a.date))
      setTimeline(items)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (doctorId) loadTimeline()
  }, [doctorId, patientId])

  const getAge = (dob: string | null) => {
    if (!dob) return 'N/A'
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4 text-blue-500" />
      case 'prescription': return <Pill className="h-4 w-4 text-purple-500" />
      case 'record': return <FileText className="h-4 w-4 text-green-500" />
      case 'vital': return <Activity className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
    }
    return <Badge className={`text-xs ${variants[status] || ''}`}>{status}</Badge>
  }

  const filtered = activeTab === 'all' ? timeline : timeline.filter(i => i.type === activeTab)

  return (
    <ProtectedRoute allowedUserTypes={['doctor']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/doctor/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Patient History</h1>
              <p className="text-sm text-muted-foreground">Complete medical timeline</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadTimeline}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Patient Profile Card */}
          {profile && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-lg">{profile.full_name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{profile.full_name || 'Unknown Patient'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        Age: {getAge(profile.date_of_birth)} | {profile.gender || 'N/A'}
                      </div>
                      {profile.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" /> {profile.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {profile.email}
                      </div>
                      {profile.address && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {profile.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{timeline.length} records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({timeline.length})</TabsTrigger>
              <TabsTrigger value="appointment"><Calendar className="h-3 w-3 mr-1" /> Appointments</TabsTrigger>
              <TabsTrigger value="prescription"><Pill className="h-3 w-3 mr-1" /> Prescriptions</TabsTrigger>
              <TabsTrigger value="record"><FileText className="h-3 w-3 mr-1" /> Records</TabsTrigger>
              <TabsTrigger value="vital"><Activity className="h-3 w-3 mr-1" /> Vitals</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-600">No records found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeTab === 'all' ? 'No medical history for this patient' : `No ${activeTab} records`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filtered.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getTypeIcon(item.type)}</div>
                          <div className="flex-1 min-w-0">
                            {/* Appointment */}
                            {item.type === 'appointment' && (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{item.data.type} appointment</span>
                                  {getStatusBadge(item.data.status)}
                                  {item.data.is_urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Reason: {item.data.reason}</p>
                                {item.data.notes && <p className="text-xs text-muted-foreground">Notes: {item.data.notes}</p>}
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span><Clock className="h-3 w-3 inline mr-1" />{item.data.appointment_time}</span>
                                  {item.data.fee && <span>Fee: ${item.data.fee}</span>}
                                </div>
                              </>
                            )}

                            {/* Prescription */}
                            {item.type === 'prescription' && (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">
                                    Prescription — {(item.data.medications || []).length} medication{(item.data.medications || []).length !== 1 ? 's' : ''}
                                  </span>
                                  {getStatusBadge(item.data.status)}
                                </div>
                                <div className="mt-1 space-y-1">
                                  {(item.data.medications || []).slice(0, 3).map((med: any, i: number) => (
                                    <p key={i} className="text-sm text-muted-foreground">
                                      {med.name} — {med.dosage}, {med.frequency}
                                    </p>
                                  ))}
                                  {(item.data.medications || []).length > 3 && (
                                    <p className="text-xs text-muted-foreground">+{item.data.medications.length - 3} more</p>
                                  )}
                                </div>
                                {item.data.instructions && (
                                  <p className="text-xs text-orange-600 mt-1">Instructions: {item.data.instructions}</p>
                                )}
                              </>
                            )}

                            {/* Health Record */}
                            {item.type === 'record' && (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{item.data.title}</span>
                                  <Badge variant="outline" className="text-xs">{item.data.type}</Badge>
                                  {item.data.is_critical && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                                </div>
                                {item.data.ai_summary && <p className="text-sm text-muted-foreground mt-1">{item.data.ai_summary}</p>}
                                {item.data.file_url && (
                                  <a href={item.data.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                    <Download className="h-3 w-3" /> View File
                                  </a>
                                )}
                              </>
                            )}

                            {/* Vital Sign */}
                            {item.type === 'vital' && (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{item.data.type?.replace(/_/g, ' ')}</span>
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {item.data.value} {item.data.unit}
                                  </Badge>
                                </div>
                                {item.data.notes && <p className="text-xs text-muted-foreground mt-1">{item.data.notes}</p>}
                              </>
                            )}
                          </div>

                          {/* Date */}
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
