'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Clock,
  Play,
  Square,
  Timer,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Calendar,
  User,
  Zap,
} from 'lucide-react'

type TimeTrackingData = {
  totalTrackedSessions: number
  avgDuration: number
  avgByType: Record<string, number>
  hoursByMonth: Record<string, number>
  todaySessions: any[]
  todayTotalMinutes: number
  todayPending: any[]
  activeConsultation: any | null
  recentSessions: any[]
}

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [data, setData] = useState<TimeTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetch(`/api/doctors?action=get-by-user&userId=${user.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) setDoctorId(result.data.id)
        })
    }
  }, [user])

  const loadData = useCallback(async () => {
    if (!doctorId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments?action=time-tracking&doctorId=${doctorId}`)
      const result = await response.json()
      if (result.success) setData(result.data)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    if (doctorId) loadData()
  }, [doctorId, loadData])

  // Live timer
  useEffect(() => {
    if (!data?.activeConsultation?.actual_start_time || data?.activeConsultation?.actual_end_time) return

    const startTime = new Date(data.activeConsultation.actual_start_time).getTime()
    const updateElapsed = () => setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    updateElapsed()

    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [data?.activeConsultation])

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const startConsultation = async () => {
    if (!selectedAppointment) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-consultation', appointmentId: selectedAppointment }),
      })
      const result = await response.json()
      if (result.success) {
        setSelectedAppointment('')
        loadData()
      }
    } catch {
      // Handle error
    } finally {
      setActionLoading(false)
    }
  }

  const endConsultation = async () => {
    if (!data?.activeConsultation) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end-consultation', appointmentId: data.activeConsultation.id }),
      })
      const result = await response.json()
      if (result.success) {
        setElapsedSeconds(0)
        loadData()
      }
    } catch {
      // Handle error
    } finally {
      setActionLoading(false)
    }
  }

  // Monthly hours chart data
  const monthKeys = data ? Object.keys(data.hoursByMonth).sort().slice(-8) : []
  const maxMonthHours = monthKeys.length > 0 ? Math.max(...monthKeys.map(m => data!.hoursByMonth[m] || 0), 1) : 1

  return (
    <ProtectedRoute allowedUserTypes={['doctor']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/doctor/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Time Tracking</h1>
              <p className="text-sm text-muted-foreground">Monitor consultation times and schedule efficiency</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Active Timer Card */}
              <Card className={data?.activeConsultation ? 'border-green-300 bg-green-50/50' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    {data?.activeConsultation ? 'Active Consultation' : 'Start a Consultation'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.activeConsultation ? (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{(data.activeConsultation.patients as any)?.full_name || 'Patient'}</span>
                        <Badge variant="outline" className="text-xs capitalize">{data.activeConsultation.type}</Badge>
                      </div>
                      <div className="text-5xl font-mono font-bold text-green-600">
                        {formatElapsed(elapsedSeconds)}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3 text-green-500 animate-pulse" />
                        Timer running since {new Date(data.activeConsultation.actual_start_time).toLocaleTimeString()}
                      </div>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={endConsultation}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                        End Consultation
                      </Button>
                    </div>
                  ) : data?.todayPending && data.todayPending.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Select an appointment to start tracking:</p>
                        <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose appointment..." />
                          </SelectTrigger>
                          <SelectContent>
                            {data.todayPending.map((apt: any) => (
                              <SelectItem key={apt.id} value={apt.id}>
                                {apt.appointment_time} — {(apt.patients as any)?.full_name || 'Patient'} ({apt.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={startConsultation}
                        disabled={!selectedAppointment || actionLoading}
                      >
                        {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Start Consultation
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No pending appointments for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">{formatMinutes(data?.todayTotalMinutes || 0)}</p>
                    <p className="text-xs text-muted-foreground">Today&apos;s Hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Timer className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold">{data?.avgDuration || 0}m</p>
                    <p className="text-xs text-muted-foreground">Avg Duration</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold">{data?.todaySessions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Sessions Today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold">{data?.totalTrackedSessions || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Completed Sessions */}
              {data?.todaySessions && data.todaySessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today&apos;s Completed Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.todaySessions.map((session: any) => (
                        <div key={session.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{(session.patients as any)?.full_name || 'Patient'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{session.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{session.actualDuration}m</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(session.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {session.actualDuration > (session.duration || 30) * 1.5 && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Over time</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Average Duration by Type */}
                {data?.avgByType && Object.keys(data.avgByType).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Avg Duration by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(data.avgByType)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, avg]) => {
                          const maxAvg = Math.max(...Object.values(data.avgByType), 1)
                          const pct = (avg / maxAvg) * 100
                          return (
                            <div key={type}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">{type.replace('_', ' ')}</span>
                                <span className="font-medium">{avg}m</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                    </CardContent>
                  </Card>
                )}

                {/* Monthly Hours */}
                {monthKeys.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Hours</CardTitle>
                      <CardDescription>Consultation hours worked</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 h-40">
                        {monthKeys.map(month => {
                          const hours = data!.hoursByMonth[month] || 0
                          const height = (hours / maxMonthHours) * 100
                          return (
                            <div key={month} className="flex-1 flex flex-col items-center">
                              <span className="text-[10px] font-medium mb-1">{hours.toFixed(1)}h</span>
                              <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                              <span className="text-[10px] text-muted-foreground mt-1 -rotate-45">{month.slice(5)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recent Sessions */}
              {data?.recentSessions && data.recentSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Sessions</CardTitle>
                    <CardDescription>Last 20 tracked consultations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.recentSessions.map((session: any) => (
                        <div key={session.id} className="flex items-center gap-3 p-2 border rounded-lg text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground w-24">{new Date(session.appointment_date).toLocaleDateString()}</span>
                          <span className="flex-1 truncate">{(session.patients as any)?.full_name || 'Patient'}</span>
                          <Badge variant="outline" className="text-xs capitalize">{session.type}</Badge>
                          <span className="font-medium w-12 text-right">{session.actualDuration}m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
