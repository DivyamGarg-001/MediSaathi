'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, FileText, HeartPulse, Phone, RefreshCw, Shield, Siren, UserRound } from 'lucide-react'

type EmergencyContact = {
  id: string
  full_name: string
  relationship: string
  phone: string | null
  emergency_contact: boolean
}

type CriticalRecord = {
  id: string
  title: string
  type: string
  file_url: string | null
  date_recorded: string
  is_critical: boolean
  content: string | null
}

type Vital = {
  id: string
  type: string
  value: string
  unit: string
  recorded_at: string
}

type EmergencyHospital = {
  id: string
  name: string
  phone: string
  address: string
  rating: number
}

type EmergencyData = {
  userProfile: {
    full_name: string | null
    phone: string | null
    email: string
    date_of_birth: string | null
    gender: string | null
    address: string | null
  } | null
  emergencyContacts: EmergencyContact[]
  criticalHealthRecords: CriticalRecord[]
  latestVitals: Vital[]
  emergencyHospitals: EmergencyHospital[]
  generatedAt: string
}

const typeLabel = (type: string) => type.replace('_', ' ')

export default function PatientSosPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EmergencyData | null>(null)

  const loadEmergencyData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/emergency-sos?userId=${user.id}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to load SOS information')
      }

      setData(result.data)
    } catch (loadError) {
      console.error('Failed to load emergency data:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load SOS information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadEmergencyData()
    }
  }, [user])

  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <div className="min-h-screen bg-red-50/60">
        <div className="border-b border-red-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="container py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/patient/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-600" />
                <h1 className="text-lg font-semibold text-red-700">Emergency SOS</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadEmergencyData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          <Card className="border-red-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Immediate Help
              </CardTitle>
              <CardDescription>
                Use these actions when urgent assistance is needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <a href="tel:112">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Call 112
                </Button>
              </a>
              {data?.emergencyContacts.find(c => c.phone)?.phone && (
                <a href={`tel:${data.emergencyContacts.find(c => c.phone)?.phone}`}>
                  <Button variant="outline" className="border-red-300">
                    <UserRound className="h-4 w-4 mr-2" />
                    Call Primary Contact
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="min-h-[240px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
            </div>
          ) : error ? (
            <Card className="border-red-200">
              <CardContent className="py-8 text-center space-y-3">
                <p className="text-red-700">{error}</p>
                <Button onClick={loadEmergencyData} variant="outline">Try Again</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    Emergency Contacts
                  </CardTitle>
                  <CardDescription>Contacts marked as emergency contacts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.emergencyContacts.length ? data.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{contact.full_name}</p>
                        <Badge variant="outline">{contact.relationship}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contact.phone || 'Phone not added'}
                      </p>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`}>
                          <Button size="sm" variant="outline" className="mt-2 w-full">
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </a>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No emergency contacts configured yet.</p>
                  )}
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Critical Health Information
                    </CardTitle>
                    <CardDescription>Important records and recent vitals for rapid response</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <p className="text-sm font-medium mb-2">Patient Snapshot</p>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-md border p-2">Name: {data?.userProfile?.full_name || 'Not set'}</div>
                        <div className="rounded-md border p-2">Phone: {data?.userProfile?.phone || 'Not set'}</div>
                        <div className="rounded-md border p-2">Gender: {data?.userProfile?.gender || 'Not set'}</div>
                        <div className="rounded-md border p-2">DOB: {data?.userProfile?.date_of_birth || 'Not set'}</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Critical Records</p>
                      {data?.criticalHealthRecords.length ? (
                        <div className="space-y-2">
                          {data.criticalHealthRecords.map((record) => (
                            <div key={record.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{record.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(record.date_recorded).toLocaleDateString()} | {typeLabel(record.type)}
                                </p>
                              </div>
                              {record.file_url ? (
                                <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Open
                                  </Button>
                                </a>
                              ) : (
                                <Badge variant="outline">No file</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No critical records marked yet.</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Latest Vitals</p>
                      {data?.latestVitals.length ? (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {data.latestVitals.map((vital) => (
                            <div key={vital.id} className="rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground">{typeLabel(vital.type)}</p>
                              <p className="font-medium flex items-center gap-1">
                                <HeartPulse className="h-3 w-3 text-red-500" />
                                {vital.value} {vital.unit}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(vital.recorded_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent vitals found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle>Nearby Emergency Hospitals</CardTitle>
                    <CardDescription>Top emergency-enabled hospitals in the network</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data?.emergencyHospitals.length ? data.emergencyHospitals.map((hospital) => (
                      <div key={hospital.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-muted-foreground">{hospital.address || 'Address unavailable'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{Number(hospital.rating || 0).toFixed(1)}</Badge>
                          {hospital.phone && (
                            <a href={`tel:${hospital.phone}`}>
                              <Button size="sm" variant="outline">
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">No emergency hospitals available right now.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
