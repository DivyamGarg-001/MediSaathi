'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, LogOut, Loader2, Save, Lock, ShieldCheck, User as UserIcon, Stethoscope, CalendarDays, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { normalizePhone } from '@/lib/utils/phone'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type Day = typeof DAYS[number]

type UserRow = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  address: string | null
  avatar_url: string | null
  user_type: 'patient' | 'doctor' | 'hospital'
}

type DoctorRow = {
  id: string
  user_id: string
  specialty: string
  license_number: string
  experience_years: number | null
  education: string | null
  hospital_id: string | null
  consultation_fee: number | null
  available_days: string[]
  available_hours: string
  bio: string | null
  rating: number | null
  total_patients: number | null
  hospitals?: { name: string; address: string } | null
}

export default function DoctorSettingsPage() {
  return (
    <ProtectedRoute allowedUserTypes={['doctor']}>
      <DoctorSettings />
    </ProtectedRoute>
  )
}

function DoctorSettings() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [doctor, setDoctor] = useState<DoctorRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingProfessional, setSavingProfessional] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false)

  // Personal form
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    address: '',
  })

  // Professional form
  const [professionalForm, setProfessionalForm] = useState({
    specialty: '',
    experience_years: '',
    education: '',
    bio: '',
    consultation_fee: '',
  })

  // Availability form
  const [availDays, setAvailDays] = useState<Day[]>([])
  const [hoursStart, setHoursStart] = useState('09:00')
  const [hoursEnd, setHoursEnd] = useState('17:00')

  // Password
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    loadAll()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSupabaseSession(!!session)
    })
  }, [user])

  async function loadAll() {
    if (!user) return
    setLoading(true)
    try {
      const [profileRes, doctorRes] = await Promise.all([
        fetch(`/api/profile?userId=${user.id}`),
        fetch(`/api/doctors?action=get-by-user&userId=${user.id}`),
      ])
      const profileJson = await profileRes.json()
      const doctorJson = await doctorRes.json()

      if (profileJson.success && profileJson.data) {
        const p: UserRow = profileJson.data
        setProfile(p)
        setPersonalForm({
          full_name: p.full_name || '',
          phone: p.phone || '',
          date_of_birth: p.date_of_birth || '',
          gender: (p.gender || '') as any,
          address: p.address || '',
        })
      } else {
        toast.error('Could not load your profile')
      }

      if (doctorJson.success && doctorJson.data) {
        const d: DoctorRow = doctorJson.data
        setDoctor(d)
        setProfessionalForm({
          specialty: d.specialty || '',
          experience_years: d.experience_years?.toString() || '',
          education: d.education || '',
          bio: d.bio || '',
          consultation_fee: d.consultation_fee?.toString() || '',
        })
        setAvailDays((d.available_days as Day[]) || [])
        const [start, end] = (d.available_hours || '09:00-17:00').split('-')
        setHoursStart(start || '09:00')
        setHoursEnd(end || '17:00')
      } else {
        toast.error('Could not load your doctor profile')
      }
    } catch {
      toast.error('Could not load your profile')
    } finally {
      setLoading(false)
    }
  }

  async function savePersonal() {
    if (!user) return
    let normalizedPhone: string | null = null
    if (personalForm.phone.trim()) {
      normalizedPhone = normalizePhone(personalForm.phone)
      if (!normalizedPhone) {
        toast.error('Enter a valid Indian mobile number (10 digits, starts with 6/7/8/9)')
        return
      }
    }
    setSavingPersonal(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          full_name: personalForm.full_name.trim() || null,
          phone: normalizedPhone,
          date_of_birth: personalForm.date_of_birth || null,
          gender: personalForm.gender || null,
          address: personalForm.address.trim() || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Personal details updated')
        setProfile(json.data)
      } else {
        toast.error(json.error || 'Could not save changes')
      }
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSavingPersonal(false)
    }
  }

  async function saveProfessional() {
    if (!doctor) return
    if (!professionalForm.specialty.trim()) {
      toast.error('Specialty is required')
      return
    }
    setSavingProfessional(true)
    try {
      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          doctorId: doctor.id,
          updates: {
            specialty: professionalForm.specialty.trim(),
            experience_years: professionalForm.experience_years ? parseInt(professionalForm.experience_years, 10) : null,
            education: professionalForm.education.trim() || null,
            bio: professionalForm.bio.trim() || null,
            consultation_fee: professionalForm.consultation_fee ? parseFloat(professionalForm.consultation_fee) : null,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Professional profile updated')
        setDoctor({ ...doctor, ...json.data })
      } else {
        toast.error(json.error || 'Could not save changes')
      }
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSavingProfessional(false)
    }
  }

  async function saveAvailability() {
    if (!doctor) return
    if (availDays.length === 0) {
      toast.error('Select at least one available day')
      return
    }
    if (hoursStart >= hoursEnd) {
      toast.error('End time must be after start time')
      return
    }
    setSavingAvailability(true)
    try {
      const res = await fetch('/api/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          doctorId: doctor.id,
          updates: {
            available_days: availDays,
            available_hours: `${hoursStart}-${hoursEnd}`,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Availability updated')
        setDoctor({ ...doctor, ...json.data })
      } else {
        toast.error(json.error || 'Could not save changes')
      }
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSavingAvailability(false)
    }
  }

  async function changePassword() {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error
      toast.success('Password updated')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (e: any) {
      toast.error(e.message || 'Could not update password')
    } finally {
      setChangingPassword(false)
    }
  }

  function toggleDay(day: Day) {
    setAvailDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]))
  }

  if (loading || !profile || !doctor) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initials =
    profile.full_name
      ?.split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2) || 'D'

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/doctor/dashboard">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>

      {/* Header strip */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{profile.full_name || 'Unnamed'}</h1>
                <Badge variant="secondary" className="capitalize">
                  {profile.user_type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {doctor.specialty} • {profile.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">
            <UserIcon className="size-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Stethoscope className="size-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="availability">
            <CalendarDays className="size-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* PERSONAL TAB */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Update your personal details. Email is tied to your login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    value={personalForm.full_name}
                    onChange={(e) => setPersonalForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={personalForm.phone}
                    onChange={(e) => setPersonalForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                  <p className="text-xs text-muted-foreground">10-digit Indian mobile. +91 is optional and added on save.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={personalForm.date_of_birth}
                    onChange={(e) => setPersonalForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={personalForm.gender} onValueChange={(v) => setPersonalForm(f => ({ ...f, gender: v as any }))}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={savePersonal} disabled={savingPersonal}>
                  {savingPersonal ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFESSIONAL TAB */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Professional profile</CardTitle>
              <CardDescription>Your medical credentials and practice details. License number is verified and read-only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Input
                    id="specialty"
                    value={professionalForm.specialty}
                    onChange={(e) => setProfessionalForm(f => ({ ...f, specialty: e.target.value }))}
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License number</Label>
                  <Input id="license" value={doctor.license_number} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={professionalForm.experience_years}
                    onChange={(e) => setProfessionalForm(f => ({ ...f, experience_years: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Consultation fee (₹)</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={professionalForm.consultation_fee}
                    onChange={(e) => setProfessionalForm(f => ({ ...f, consultation_fee: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  rows={2}
                  value={professionalForm.education}
                  onChange={(e) => setProfessionalForm(f => ({ ...f, education: e.target.value }))}
                  placeholder="MBBS, MD ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={professionalForm.bio}
                  onChange={(e) => setProfessionalForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="A short description shown on your profile to patients."
                />
              </div>
              {doctor.hospitals?.name && (
                <div className="rounded-lg border bg-muted/40 p-3 flex items-center gap-3">
                  <Building2 className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Affiliated hospital</p>
                    <p className="text-muted-foreground">{doctor.hospitals.name}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveProfessional} disabled={savingProfessional}>
                  {savingProfessional ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AVAILABILITY TAB */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>Set the days and hours you're available for appointments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Available days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const active = availDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-full text-sm capitalize border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-accent'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <Label>Available hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hoursStart}
                    onChange={(e) => setHoursStart(e.target.value)}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={hoursEnd}
                    onChange={(e) => setHoursEnd(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Stored as <code>{`${hoursStart}-${hoursEnd}`}</code>
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveAvailability} disabled={savingAvailability}>
                  {savingAvailability ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                {hasSupabaseSession
                  ? 'Change your password. You signed in with email and password.'
                  : 'You signed in with Google. Manage your password through your Google account.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasSupabaseSession ? (
                <>
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="new_password">New password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="confirm_password">Confirm new password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <Button onClick={changePassword} disabled={changingPassword}>
                    {changingPassword ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                    Update password
                  </Button>
                </>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 max-w-md">
                  <p className="text-sm font-medium">Connected via Google</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your password and 2FA are managed in your Google account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
