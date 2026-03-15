'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Star,
  TrendingUp,
  RefreshCw,
  BarChart3,
} from 'lucide-react'

type Analytics = {
  totalAppointments: number
  completedCount: number
  cancelledCount: number
  noShowCount: number
  totalRevenue: number
  totalPrescriptions: number
  uniquePatients: number
  rating: number
  byType: Record<string, number>
  monthlyAppointments: Record<string, number>
  revenueByMonth: Record<string, number>
  topReasons: { reason: string; count: number }[]
  genderDistribution: Record<string, number>
  ageBrackets: Record<string, number>
}

const TYPE_COLORS: Record<string, string> = {
  consultation: 'bg-blue-500',
  follow_up: 'bg-green-500',
  emergency: 'bg-red-500',
  telemedicine: 'bg-purple-500',
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetch(`/api/doctors?action=get-by-user&userId=${user.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) setDoctorId(result.data.id)
        })
    }
  }, [user])

  const loadAnalytics = async () => {
    if (!doctorId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/doctors?action=analytics&doctorId=${doctorId}`)
      const result = await response.json()
      if (result.success) setAnalytics(result.data)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (doctorId) loadAnalytics()
  }, [doctorId])

  // Get sorted months for charts
  const sortedMonths = analytics
    ? Object.keys(analytics.monthlyAppointments).sort().slice(-12)
    : []

  const maxMonthlyCount = sortedMonths.length > 0
    ? Math.max(...sortedMonths.map(m => analytics!.monthlyAppointments[m] || 0), 1)
    : 1

  const maxRevenue = sortedMonths.length > 0
    ? Math.max(...sortedMonths.map(m => analytics!.revenueByMonth[m] || 0), 1)
    : 1

  const totalByType = analytics ? Object.values(analytics.byType).reduce((a, b) => a + b, 0) : 0

  return (
    <ProtectedRoute allowedUserTypes={['doctor']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/doctor/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Practice Analytics</h1>
              <p className="text-sm text-muted-foreground">Track your practice performance with real data</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadAnalytics}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !analytics ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-600">No analytics data yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">Total Appointments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.completedCount}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <XCircle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.cancelledCount}</p>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold">{analytics.noShowCount}</p>
                    <p className="text-xs text-muted-foreground">No Shows</p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Unique Patients</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.uniquePatients}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Prescriptions</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.totalPrescriptions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Rating</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.rating}/5</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Appointment Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appointment Types</CardTitle>
                    <CardDescription>Distribution by type</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analytics.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                      const pct = totalByType > 0 ? (count / totalByType) * 100 : 0
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                            <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${TYPE_COLORS[type] || 'bg-primary'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    {Object.keys(analytics.byType).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No appointment data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Appointments Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Trend</CardTitle>
                    <CardDescription>Appointments per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sortedMonths.length > 0 ? (
                      <div className="flex items-end gap-1 h-40">
                        {sortedMonths.map(month => {
                          const count = analytics.monthlyAppointments[month] || 0
                          const height = (count / maxMonthlyCount) * 100
                          return (
                            <div key={month} className="flex-1 flex flex-col items-center">
                              <span className="text-xs font-medium mb-1">{count}</span>
                              <div className="w-full bg-primary/80 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }} title={`${month}: ${count}`} />
                              <span className="text-[10px] text-muted-foreground mt-1 -rotate-45">{month.slice(5)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Month */}
              {sortedMonths.some(m => (analytics.revenueByMonth[m] || 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-40">
                      {sortedMonths.map(month => {
                        const revenue = analytics.revenueByMonth[month] || 0
                        const height = (revenue / maxRevenue) * 100
                        return (
                          <div key={month} className="flex-1 flex flex-col items-center">
                            <span className="text-[10px] font-medium mb-1">${revenue}</span>
                            <div className="w-full bg-green-500/80 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
                            <span className="text-[10px] text-muted-foreground mt-1 -rotate-45">{month.slice(5)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Gender Distribution</p>
                      {Object.entries(analytics.genderDistribution).map(([gender, count]) => {
                        const pct = analytics.uniquePatients > 0 ? (count / analytics.uniquePatients) * 100 : 0
                        return (
                          <div key={gender} className="flex items-center gap-2 mb-1">
                            <span className="text-sm capitalize w-20">{gender}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Age Brackets</p>
                      {Object.entries(analytics.ageBrackets).map(([bracket, count]) => {
                        const pct = analytics.uniquePatients > 0 ? (count / analytics.uniquePatients) * 100 : 0
                        return (
                          <div key={bracket} className="flex items-center gap-2 mb-1">
                            <span className="text-sm w-20">{bracket}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Reasons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Visit Reasons</CardTitle>
                    <CardDescription>Most common appointment reasons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.topReasons.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.topReasons.map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="text-sm truncate flex-1">{r.reason}</span>
                            <Badge variant="secondary" className="text-xs ml-2">{r.count}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
