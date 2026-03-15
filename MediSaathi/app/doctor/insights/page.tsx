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
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Calendar,
} from 'lucide-react'

type PracticeInsights = {
  kpis: {
    completionRate: number
    cancellationRate: number
    noShowRate: number
    avgRevenue: number
    retentionRate: number
    avgConsultationMinutes: number
  }
  peakHours: Record<string, number>
  dayDistribution: Record<string, number>
  scheduleUtilization: { weeklyCapacity: number; weeklyBooked: number; utilizationRate: number }
  revenueByMonth: Record<string, number>
  typeByMonth: Record<string, Record<string, number>>
  recommendations: { text: string; type: 'success' | 'warning' | 'info' }[]
}

export default function InsightsPage() {
  const { user } = useAuth()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [insights, setInsights] = useState<PracticeInsights | null>(null)
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

  const loadInsights = async () => {
    if (!doctorId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/doctors/insights?doctorId=${doctorId}`)
      const result = await response.json()
      if (result.success) setInsights(result.data)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (doctorId) loadInsights()
  }, [doctorId])

  const getKpiColor = (value: number, good: 'high' | 'low', thresholds: [number, number]) => {
    const isGood = good === 'high' ? value >= thresholds[0] : value <= thresholds[0]
    const isBad = good === 'high' ? value < thresholds[1] : value > thresholds[1]
    if (isGood) return 'text-green-600'
    if (isBad) return 'text-red-600'
    return 'text-yellow-600'
  }

  const sortedHours = insights
    ? Object.entries(insights.peakHours).sort(([a], [b]) => a.localeCompare(b))
    : []

  const maxHourCount = sortedHours.length > 0 ? Math.max(...sortedHours.map(([, c]) => c), 1) : 1

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const maxDayCount = insights
    ? Math.max(...days.map(d => insights.dayDistribution[d] || 0), 1)
    : 1

  const revenueMonths = insights
    ? Object.keys(insights.revenueByMonth).sort().slice(-8)
    : []
  const maxRevenue = revenueMonths.length > 0
    ? Math.max(...revenueMonths.map(m => insights!.revenueByMonth[m] || 0), 1)
    : 1

  return (
    <ProtectedRoute allowedUserTypes={['doctor']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/doctor/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Practice Insights</h1>
              <p className="text-sm text-muted-foreground">Actionable insights to improve your practice</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadInsights}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !insights ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-600">No insights available yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className={`text-xl font-bold ${getKpiColor(insights.kpis.completionRate, 'high', [85, 70])}`}>
                      {insights.kpis.completionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <XCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
                    <p className={`text-xl font-bold ${getKpiColor(insights.kpis.cancellationRate, 'low', [10, 20])}`}>
                      {insights.kpis.cancellationRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Cancellation</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className={`text-xl font-bold ${getKpiColor(insights.kpis.noShowRate, 'low', [5, 15])}`}>
                      {insights.kpis.noShowRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">No-Show</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-xl font-bold">${insights.kpis.avgRevenue}</p>
                    <p className="text-xs text-muted-foreground">Avg Revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className={`text-xl font-bold ${getKpiColor(insights.kpis.retentionRate, 'high', [50, 30])}`}>
                      {insights.kpis.retentionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Retention</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-xl font-bold">
                      {insights.kpis.avgConsultationMinutes > 0 ? `${insights.kpis.avgConsultationMinutes}m` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Duration</p>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule Utilization</CardTitle>
                  <CardDescription>
                    {insights.scheduleUtilization.weeklyBooked} of {insights.scheduleUtilization.weeklyCapacity} weekly slots booked (avg)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization Rate</span>
                      <span className="font-bold">{insights.scheduleUtilization.utilizationRate}%</span>
                    </div>
                    <Progress value={insights.scheduleUtilization.utilizationRate} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Peak Hours</CardTitle>
                    <CardDescription>Busiest appointment hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sortedHours.length > 0 ? (
                      <div className="space-y-1">
                        {sortedHours.map(([hour, count]) => {
                          const pct = (count / maxHourCount) * 100
                          const isPeak = count === maxHourCount
                          return (
                            <div key={hour} className="flex items-center gap-2">
                              <span className="text-xs w-12 text-right">{hour}:00</span>
                              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isPeak ? 'bg-orange-500' : 'bg-primary/70'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs w-8 font-medium">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Day Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Day Distribution</CardTitle>
                    <CardDescription>Appointments by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-40">
                      {days.map(day => {
                        const count = insights.dayDistribution[day] || 0
                        const height = (count / maxDayCount) * 100
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center">
                            <span className="text-xs font-medium mb-1">{count}</span>
                            <div
                              className="w-full bg-primary/70 rounded-t transition-all"
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1">{day.slice(0, 3)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend */}
              {revenueMonths.some(m => (insights.revenueByMonth[m] || 0) > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-40">
                      {revenueMonths.map(month => {
                        const revenue = insights.revenueByMonth[month] || 0
                        const height = (revenue / maxRevenue) * 100
                        return (
                          <div key={month} className="flex-1 flex flex-col items-center">
                            <span className="text-[10px] font-medium mb-1">${revenue}</span>
                            <div className="w-full bg-green-500/80 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                            <span className="text-[10px] text-muted-foreground mt-1 -rotate-45">{month.slice(5)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>Based on your practice data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'success' ? 'bg-green-50 border-l-green-500' :
                          rec.type === 'warning' ? 'bg-orange-50 border-l-orange-500' :
                          'bg-blue-50 border-l-blue-500'
                        }`}
                      >
                        <p className="text-sm">{rec.text}</p>
                      </div>
                    ))}
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
