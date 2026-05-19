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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import { ArrowLeft, LogOut, Loader2, Save, Plus, Trash2, Lock, ShieldCheck, User as UserIcon, Users } from 'lucide-react'
import { toast } from 'sonner'
import { normalizePhone } from '@/lib/utils/phone'

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

type FamilyMember = {
  id: string
  full_name: string
  relationship: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  phone: string | null
  emergency_contact: boolean
}

export default function PatientSettingsPage() {
  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <PatientSettings />
    </ProtectedRoute>
  )
}

function PatientSettings() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false)

  // Profile form state
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    address: '',
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  // Family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [familyForm, setFamilyForm] = useState({
    full_name: '',
    relationship: '',
    date_of_birth: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    phone: '',
    emergency_contact: false,
  })
  const [addFamilyOpen, setAddFamilyOpen] = useState(false)
  const [savingFamily, setSavingFamily] = useState(false)

  useEffect(() => {
    if (!user) return
    loadProfile()
    loadFamilyMembers()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSupabaseSession(!!session)
    })
  }, [user])

  async function loadProfile() {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/profile?userId=${user.id}`)
      const json = await res.json()
      if (json.success && json.data) {
        const p: UserRow = json.data
        setProfile(p)
        setForm({
          full_name: p.full_name || '',
          phone: p.phone || '',
          date_of_birth: p.date_of_birth || '',
          gender: (p.gender || '') as '' | 'male' | 'female' | 'other',
          address: p.address || '',
        })
      } else {
        toast.error('Could not load your profile')
      }
    } catch {
      toast.error('Could not load your profile')
    } finally {
      setLoading(false)
    }
  }

  async function loadFamilyMembers() {
    if (!user) return
    try {
      const res = await fetch(`/api/family-members?userId=${user.id}`)
      const json = await res.json()
      if (json.success) setFamilyMembers(json.data || [])
    } catch {
      /* non-critical */
    }
  }

  async function saveProfile() {
    if (!user) return
    let normalizedPhone: string | null = null
    if (form.phone.trim()) {
      normalizedPhone = normalizePhone(form.phone)
      if (!normalizedPhone) {
        toast.error('Enter a valid Indian mobile number (10 digits, starts with 6/7/8/9)')
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          full_name: form.full_name.trim() || null,
          phone: normalizedPhone,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          address: form.address.trim() || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Profile updated')
        setProfile(json.data)
      } else {
        toast.error(json.error || 'Could not save changes')
      }
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSaving(false)
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

  async function addFamilyMember() {
    if (!user) return
    if (!familyForm.full_name || !familyForm.relationship || !familyForm.date_of_birth || !familyForm.gender) {
      toast.error('Name, relationship, date of birth, and gender are required')
      return
    }
    let normalizedFamilyPhone: string | null = null
    if (familyForm.phone.trim()) {
      normalizedFamilyPhone = normalizePhone(familyForm.phone)
      if (!normalizedFamilyPhone) {
        toast.error('Enter a valid Indian mobile number (10 digits, starts with 6/7/8/9)')
        return
      }
    }
    setSavingFamily(true)
    try {
      const res = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberData: {
            user_id: user.id,
            full_name: familyForm.full_name.trim(),
            relationship: familyForm.relationship,
            date_of_birth: familyForm.date_of_birth,
            gender: familyForm.gender,
            phone: normalizedFamilyPhone,
            emergency_contact: familyForm.emergency_contact,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Family member added')
        setFamilyForm({ full_name: '', relationship: '', date_of_birth: '', gender: '', phone: '', emergency_contact: false })
        setAddFamilyOpen(false)
        loadFamilyMembers()
      } else {
        toast.error(json.error || 'Could not add family member')
      }
    } catch {
      toast.error('Could not add family member')
    } finally {
      setSavingFamily(false)
    }
  }

  async function deleteFamilyMember(memberId: string) {
    if (!confirm('Remove this family member? This will delete all linked vitals and insights.')) return
    try {
      const res = await fetch(`/api/family-members?memberId=${memberId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Family member removed')
        loadFamilyMembers()
      } else {
        toast.error(json.error || 'Could not remove family member')
      }
    } catch {
      toast.error('Could not remove family member')
    }
  }

  if (loading || !profile) {
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
      .substring(0, 2) || 'U'

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/patient/dashboard">
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
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="family">
            <Users className="size-4" />
            Family Members
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile information</CardTitle>
              <CardDescription>Update your personal details. Email is tied to your login and can't be changed here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your name"
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
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                  <p className="text-xs text-muted-foreground">10-digit Indian mobile. +91 is optional and added on save.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v as any }))}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
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
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street, city, state, postal code"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAMILY TAB */}
        <TabsContent value="family">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Family members</CardTitle>
                <CardDescription>Manage dependents linked to your account.</CardDescription>
              </div>
              <Dialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add family member</DialogTitle>
                    <DialogDescription>Family members can have their own appointments, vitals, and insights.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full name *</Label>
                      <Input
                        value={familyForm.full_name}
                        onChange={(e) => setFamilyForm(f => ({ ...f, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Relationship *</Label>
                        <Select value={familyForm.relationship} onValueChange={(v) => setFamilyForm(f => ({ ...f, relationship: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Select value={familyForm.gender} onValueChange={(v) => setFamilyForm(f => ({ ...f, gender: v as any }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of birth *</Label>
                      <Input
                        type="date"
                        value={familyForm.date_of_birth}
                        onChange={(e) => setFamilyForm(f => ({ ...f, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={familyForm.phone}
                        onChange={(e) => setFamilyForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={familyForm.emergency_contact}
                        onChange={(e) => setFamilyForm(f => ({ ...f, emergency_contact: e.target.checked }))}
                      />
                      Emergency contact
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddFamilyOpen(false)}>Cancel</Button>
                    <Button onClick={addFamilyMember} disabled={savingFamily}>
                      {savingFamily ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Add member
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {familyMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No family members yet. Add one to start tracking their health.</p>
              ) : (
                <div className="space-y-2">
                  {familyMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback>{m.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.full_name}</span>
                            {m.emergency_contact && <Badge variant="outline" className="text-xs">Emergency</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {m.relationship} • {m.gender} • {new Date().getFullYear() - new Date(m.date_of_birth).getFullYear()} years
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFamilyMember(m.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
