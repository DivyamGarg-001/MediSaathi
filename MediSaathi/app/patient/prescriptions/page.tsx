'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  FileText,
  Search,
  Pill,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

type Medication = {
  name: string
  dosage: string
  frequency: string
  duration?: string
  notes?: string
}

type Prescription = {
  id: string
  doctor_id: string
  patient_id: string
  appointment_id: string | null
  medications: Medication[]
  instructions: string | null
  valid_until: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  updated_at: string
  doctors?: {
    id: string
    specialty: string
    users?: { full_name: string; avatar_url: string | null }
  }
  appointments?: {
    appointment_date: string
    appointment_time: string
    type: string
    reason: string
  }
}

type PrescriptionStats = {
  total: number
  active: number
  expired: number
  cancelled: number
  totalMedications: number
}

export default function PrescriptionsPage() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [stats, setStats] = useState<PrescriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const loadPrescriptions = async (status?: string) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const action = status === 'active' ? 'get-active' : status === 'expired' ? 'get-expired' : 'get-prescriptions'
      const url = `/api/prescriptions?action=${action}&userId=${user.id}${status && status !== 'active' && status !== 'expired' ? `&status=${status}` : ''}`
      const response = await fetch(url)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load prescriptions')
      setPrescriptions(result.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/prescriptions?action=stats&userId=${user.id}`)
      const result = await response.json()
      if (result.success) setStats(result.data)
    } catch {
      // Stats are non-critical
    }
  }

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) {
      loadPrescriptions()
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/prescriptions?action=search&userId=${user.id}&query=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()
      if (result.success) setPrescriptions(result.data || [])
    } catch {
      // Fall back to all prescriptions
      loadPrescriptions()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadPrescriptions()
      loadStats()
    }
  }, [user])

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getStatusBadge = (prescription: Prescription) => {
    const today = new Date().toISOString().split('T')[0]
    const isExpiredByDate = prescription.valid_until < today

    if (prescription.status === 'cancelled') {
      return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
    }
    if (prescription.status === 'expired' || isExpiredByDate) {
      return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Expired</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
  }

  const getDaysRemaining = (validUntil: string) => {
    const today = new Date()
    const expiry = new Date(validUntil)
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Expired'
    if (diff === 0) return 'Expires today'
    if (diff === 1) return '1 day left'
    return `${diff} days left`
  }

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
              <h1 className="text-2xl font-bold">My Prescriptions</h1>
              <p className="text-sm text-muted-foreground">View and manage all your prescriptions</p>
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={() => { loadPrescriptions(); loadStats() }}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto text-red-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Pill className="h-6 w-6 mx-auto text-purple-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.totalMedications}</p>
                  <p className="text-xs text-muted-foreground">Active Meds</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication name or instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" onValueChange={(val) => {
            if (val === 'all') loadPrescriptions()
            else loadPrescriptions(val)
          }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <PrescriptionList
                prescriptions={prescriptions}
                loading={loading}
                error={error}
                expandedCards={expandedCards}
                toggleExpand={toggleExpand}
                getStatusBadge={getStatusBadge}
                getDaysRemaining={getDaysRemaining}
                onViewDetails={setSelectedPrescription}
              />
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              <PrescriptionList
                prescriptions={prescriptions}
                loading={loading}
                error={error}
                expandedCards={expandedCards}
                toggleExpand={toggleExpand}
                getStatusBadge={getStatusBadge}
                getDaysRemaining={getDaysRemaining}
                onViewDetails={setSelectedPrescription}
              />
            </TabsContent>
            <TabsContent value="expired" className="mt-4">
              <PrescriptionList
                prescriptions={prescriptions}
                loading={loading}
                error={error}
                expandedCards={expandedCards}
                toggleExpand={toggleExpand}
                getStatusBadge={getStatusBadge}
                getDaysRemaining={getDaysRemaining}
                onViewDetails={setSelectedPrescription}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Prescription Detail Modal */}
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedPrescription && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Prescription Details
                  </DialogTitle>
                  <DialogDescription>
                    Prescribed on {new Date(selectedPrescription.created_at).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Doctor Info */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">
                        Dr. {selectedPrescription.doctors?.users?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {selectedPrescription.doctors?.specialty || 'General'}
                    </p>
                  </div>

                  {/* Appointment Info */}
                  {selectedPrescription.appointments && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Appointment</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {new Date(selectedPrescription.appointments.appointment_date).toLocaleDateString()} at{' '}
                        {selectedPrescription.appointments.appointment_time}
                      </p>
                      <p className="text-xs text-muted-foreground ml-6">
                        {selectedPrescription.appointments.reason}
                      </p>
                    </div>
                  )}

                  {/* Status & Validity */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(selectedPrescription)}
                    <span className="text-sm text-muted-foreground">
                      Valid until: {new Date(selectedPrescription.valid_until).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Medications */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Pill className="h-4 w-4" />
                      Medications ({selectedPrescription.medications.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedPrescription.medications.map((med: Medication, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{med.name}</p>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            <p className="text-xs text-muted-foreground">Dosage: {med.dosage}</p>
                            <p className="text-xs text-muted-foreground">Frequency: {med.frequency}</p>
                            {med.duration && (
                              <p className="text-xs text-muted-foreground">Duration: {med.duration}</p>
                            )}
                          </div>
                          {med.notes && (
                            <p className="text-xs text-orange-600 mt-1">Note: {med.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedPrescription.instructions && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium text-sm flex items-center gap-1 mb-1">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Instructions
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.instructions}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

function PrescriptionList({
  prescriptions,
  loading,
  error,
  expandedCards,
  toggleExpand,
  getStatusBadge,
  getDaysRemaining,
  onViewDetails,
}: {
  prescriptions: Prescription[]
  loading: boolean
  error: string | null
  expandedCards: Set<string>
  toggleExpand: (id: string) => void
  getStatusBadge: (p: Prescription) => React.ReactNode
  getDaysRemaining: (date: string) => string
  onViewDetails: (p: Prescription) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-600">No prescriptions found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Prescriptions from your doctors will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((prescription) => {
        const isExpanded = expandedCards.has(prescription.id)
        const meds = Array.isArray(prescription.medications) ? prescription.medications : []

        return (
          <Card key={prescription.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      Dr. {prescription.doctors?.users?.full_name || 'Unknown Doctor'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {prescription.doctors?.specialty || 'General'}
                  </p>
                </div>
                {getStatusBadge(prescription)}
              </div>

              {/* Meds Summary */}
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-purple-500" />
                <span className="text-sm">{meds.length} medication{meds.length !== 1 ? 's' : ''}</span>
                <span className="text-xs text-muted-foreground">|</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{getDaysRemaining(prescription.valid_until)}</span>
              </div>

              {/* Compact Meds List (first 2) */}
              <div className="space-y-1 mb-2">
                {meds.slice(0, isExpanded ? meds.length : 2).map((med: Medication, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <span className="font-medium">{med.name}</span>
                    <span className="text-xs text-muted-foreground">{med.dosage} - {med.frequency}</span>
                  </div>
                ))}
              </div>

              {/* Expand/Actions */}
              <div className="flex items-center justify-between">
                {meds.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(prescription.id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {isExpanded ? 'Show less' : `+${meds.length - 2} more`}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => onViewDetails(prescription)}>
                  View Details
                </Button>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                {' | '}
                Valid until: {new Date(prescription.valid_until).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
