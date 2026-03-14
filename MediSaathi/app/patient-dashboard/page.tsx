'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import ProtectedRoute from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { FileText, Calendar, Activity, Users } from 'lucide-react'

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    healthRecords: [],
    upcomingAppointments: [],
    latestVitals: [],
    familyMembers: [],
    loading: true
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [
        recordsResult,
        appointmentsResult,
        vitalsResult,
        familyResult
      ] = await Promise.all([
        fetch(`/api/health-records?action=get-records&userId=${user!.id}`).then(res => res.json()),
        fetch(`/api/appointments?action=upcoming&userId=${user!.id}&userType=patient`).then(res => res.json()),
        fetch(`/api/vital-signs?action=latest-readings&userId=${user!.id}`).then(res => res.json()),
        fetch(`/api/family-members?userId=${user!.id}`).then(res => res.json())
      ])

      setDashboardData({
        healthRecords: recordsResult.data || [],
        upcomingAppointments: appointmentsResult.data || [],
        latestVitals: vitalsResult.data || [],
        familyMembers: familyResult.data || [],
        loading: false
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDashboardData(prev => ({ ...prev, loading: false }))
    }
  }

  const addVitalSign = async (vitalData: any) => {
    try {
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vitalData: {
            ...vitalData,
            user_id: user!.id,
            recorded_at: new Date().toISOString()
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh vitals data
        const vitalsResponse = await fetch(`/api/vital-signs?action=latest-readings&userId=${user!.id}`)
        const vitalsResult = await vitalsResponse.json()
        
        setDashboardData(prev => ({
          ...prev,
          latestVitals: vitalsResult.data || []
        }))
        
        // Show abnormal reading alert if needed
        if (result.abnormal?.isAbnormal) {
          const severityLabel = result.abnormal.severity === 'high' ? '🔴 URGENT' : result.abnormal.severity === 'medium' ? '🟡 Warning' : '🟢 Notice'
          alert(`${severityLabel}: ${result.abnormal.message}`)
        }
      }
    } catch (error) {
      console.error('Error adding vital sign:', error)
    }
  }

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MS</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">MediSaathi</h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.full_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => window.location.href = '/find-doctors'}>
                  Find Doctors
                </Button>
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Health Records</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.healthRecords.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.upcomingAppointments.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Vital Signs</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {/* @ts-ignore */}
                      {dashboardData.latestVitals.filter(v => v?.data).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Family Members</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {dashboardData.familyMembers.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Health Records */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Health Records</CardTitle>
                <Button size="sm" onClick={() => window.location.href = '/health-records'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.healthRecords.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.healthRecords.slice(0, 3).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(record.date_recorded).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.is_critical ? 'destructive' : 'secondary'}>
                        {record.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No health records yet</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/health-records/add'}>
                    Add First Record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Vital Signs Entry */}
          <VitalSignsQuickEntry onAdd={addVitalSign} latestVitals={dashboardData.latestVitals} />

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Button size="sm" onClick={() => window.location.href = '/appointments'}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.doctors?.users?.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.doctors?.specialty}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No upcoming appointments</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/find-doctors'}>
                    Book Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// Quick Vital Signs Entry Component
function VitalSignsQuickEntry({ onAdd, latestVitals }: any) {
  const [selectedVital, setSelectedVital] = useState('blood_pressure')
  const [value, setValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const vitalTypes = [
    { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
    { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
    { key: 'temperature', label: 'Temperature', unit: '°F', placeholder: '98.6' },
    { key: 'weight', label: 'Weight', unit: 'lbs', placeholder: '150' },
    { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', placeholder: '100' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    setIsAdding(true)
    const vitalType = vitalTypes.find(v => v.key === selectedVital)
    
    await onAdd({
      type: selectedVital,
      value: value.trim(),
      unit: vitalType?.unit || '',
    })
    
    setValue('')
    setIsAdding(false)
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Quick Vital Signs Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <Select value={selectedVital} onValueChange={setSelectedVital}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vitalTypes.map((vital) => (
                  <SelectItem key={vital.key} value={vital.key}>
                    {vital.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={vitalTypes.find(v => v.key === selectedVital)?.placeholder}
              className="flex-1"
              required
            />
            
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>

        {/* Latest Vitals Display */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {vitalTypes.map((vitalType) => {
            const latest = latestVitals.find((v: any) => v.type === vitalType.key)?.data
            return (
              <div key={vitalType.key} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{vitalType.label}</p>
                <p className="text-lg font-semibold text-blue-600">
                  {latest ? `${latest.value} ${latest.unit}` : 'No data'}
                </p>
                {latest && (
                  <p className="text-xs text-gray-500">
                    {new Date(latest.recorded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}