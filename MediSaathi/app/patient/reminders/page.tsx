'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Bell,
  Pill,
  Calendar,
  Activity,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Zap,
  Clock,
  Heart,
  Shield,
} from 'lucide-react'

type Reminder = {
  id: string
  user_id: string
  family_member_id: string | null
  insight_type: 'risk_prediction' | 'health_trend' | 'medication_reminder' | 'checkup_due'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  action_required: boolean
  dismissed: boolean
  created_at: string
  expires_at: string | null
}

type ReminderStats = {
  total: number
  actionRequired: number
  bySeverity: { critical: number; high: number; medium: number; low: number }
  byType: {
    medication_reminder: number
    checkup_due: number
    health_trend: number
    risk_prediction: number
  }
}

export default function RemindersPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadReminders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [remindersRes, statsRes] = await Promise.all([
        fetch(`/api/reminders?action=get-reminders&userId=${user.id}`),
        fetch(`/api/reminders?action=stats&userId=${user.id}`)
      ])
      const remindersData = await remindersRes.json()
      const statsData = await statsRes.json()

      if (remindersData.success) setReminders(remindersData.data || [])
      if (statsData.success) setStats(statsData.data)
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }

  const generateReminders = async () => {
    if (!user) return
    setGenerating(true)
    try {
      const response = await fetch(`/api/reminders?action=generate-all&userId=${user.id}`)
      const result = await response.json()
      if (result.success) {
        setReminders(result.data || [])
        // Reload stats
        const statsRes = await fetch(`/api/reminders?action=stats&userId=${user.id}`)
        const statsData = await statsRes.json()
        if (statsData.success) setStats(statsData.data)
      }
    } catch {
      // Handle error
    } finally {
      setGenerating(false)
    }
  }

  const dismissReminder = async (reminderId: string) => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, action: 'dismiss' })
      })
      const result = await response.json()
      if (result.success) {
        setReminders(prev => prev.filter(r => r.id !== reminderId))
        if (stats) {
          setStats({ ...stats, total: stats.total - 1 })
        }
      }
    } catch {
      // Handle error
    }
  }

  useEffect(() => {
    if (user) loadReminders()
  }, [user])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication_reminder': return <Pill className="h-5 w-5 text-purple-500" />
      case 'checkup_due': return <Calendar className="h-5 w-5 text-blue-500" />
      case 'health_trend': return <Activity className="h-5 w-5 text-green-500" />
      case 'risk_prediction': return <AlertTriangle className="h-5 w-5 text-red-500" />
      default: return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'medication_reminder': return 'Medication'
      case 'checkup_due': return 'Checkup'
      case 'health_trend': return 'Health Trend'
      case 'risk_prediction': return 'Risk Alert'
      default: return type
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="text-xs">Critical</Badge>
      case 'high': return <Badge className="bg-orange-100 text-orange-800 text-xs">High</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
      case 'low': return <Badge className="bg-green-100 text-green-800 text-xs">Low</Badge>
      default: return <Badge variant="secondary" className="text-xs">{severity}</Badge>
    }
  }

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500'
      case 'high': return 'border-l-orange-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const filteredReminders = activeTab === 'all'
    ? reminders
    : reminders.filter(r => r.insight_type === activeTab)

  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/patient/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Smart Reminders</h1>
              <p className="text-sm text-muted-foreground">Medication, appointment & health reminders</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={loadReminders}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" onClick={generateReminders} disabled={generating}>
                {generating ? (
                  <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-1" /> Generate Reminders</>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Bell className="h-6 w-6 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Active Reminders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.actionRequired}</p>
                  <p className="text-xs text-muted-foreground">Action Required</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Pill className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.byType.medication_reminder}</p>
                  <p className="text-xs text-muted-foreground">Medications</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.byType.checkup_due}</p>
                  <p className="text-xs text-muted-foreground">Checkups Due</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Severity Summary */}
          {stats && (stats.bySeverity.critical > 0 || stats.bySeverity.high > 0) && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-sm">
                    {stats.bySeverity.critical > 0 && `${stats.bySeverity.critical} critical`}
                    {stats.bySeverity.critical > 0 && stats.bySeverity.high > 0 && ' and '}
                    {stats.bySeverity.high > 0 && `${stats.bySeverity.high} high priority`}
                    {' '}reminder{(stats.bySeverity.critical + stats.bySeverity.high) !== 1 ? 's' : ''} need your attention
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs & Reminders List */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({reminders.length})
              </TabsTrigger>
              <TabsTrigger value="medication_reminder">
                <Pill className="h-3 w-3 mr-1" /> Meds
              </TabsTrigger>
              <TabsTrigger value="checkup_due">
                <Calendar className="h-3 w-3 mr-1" /> Checkups
              </TabsTrigger>
              <TabsTrigger value="health_trend">
                <Activity className="h-3 w-3 mr-1" /> Trends
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredReminders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-600">
                      {reminders.length === 0 ? 'No reminders yet' : 'No reminders in this category'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reminders.length === 0
                        ? 'Click "Generate Reminders" to analyze your health data and create smart reminders'
                        : 'Check other categories for your reminders'}
                    </p>
                    {reminders.length === 0 && (
                      <Button className="mt-4" size="sm" onClick={generateReminders} disabled={generating}>
                        <Zap className="h-4 w-4 mr-1" />
                        Generate Reminders
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredReminders.map((reminder) => (
                    <Card
                      key={reminder.id}
                      className={`border-l-4 ${getSeverityBorderColor(reminder.severity)} overflow-hidden`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getTypeIcon(reminder.insight_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm">{reminder.title}</span>
                              {getSeverityBadge(reminder.severity)}
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(reminder.insight_type)}
                              </Badge>
                              {reminder.action_required && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{reminder.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(reminder.created_at).toLocaleDateString()}
                              </span>
                              {reminder.expires_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expires: {new Date(reminder.expires_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-500 shrink-0"
                            onClick={() => dismissReminder(reminder.id)}
                            title="Dismiss"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
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
