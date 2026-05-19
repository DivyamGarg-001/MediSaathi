'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  HealthRecordViewerSheet,
  RECORD_TYPE_META as TYPE_META,
  RECORD_TYPE_KEYS as TYPE_KEYS,
  type HealthRecord as RecordRow,
  type FamilyMemberSummary,
} from '@/components/health-record-viewer'
import {
  ArrowLeft,
  Search,
  ShieldAlert,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react'

export default function HealthRecordsPage() {
  return (
    <ProtectedRoute allowedUserTypes={['patient']}>
      <HealthRecords />
    </ProtectedRoute>
  )
}

function HealthRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState<RecordRow[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberSummary[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<string>('all') // 'all' | 'self' | family_member_id
  const [criticalOnly, setCriticalOnly] = useState(false)

  // Viewer
  const [openRecordId, setOpenRecordId] = useState<string | null>(null)
  // Derive openRecord from the records list so re-analyze refreshes the viewer in place
  const openRecord = openRecordId ? records.find(r => r.id === openRecordId) ?? null : null

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user])

  async function loadAll() {
    if (!user) return
    setLoading(true)
    try {
      const [recordsRes, familyRes] = await Promise.all([
        fetch(`/api/health-records?action=get-records&userId=${user.id}`).then(r => r.json()),
        fetch(`/api/family-members?userId=${user.id}`).then(r => r.json()),
      ])
      if (recordsRes.success) setRecords(recordsRes.data || [])
      if (familyRes.success) setFamilyMembers(familyRes.data || [])
    } catch (err) {
      console.error('Failed to load records', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter(r => {
      if (criticalOnly && !r.is_critical) return false

      if (memberFilter === 'self') {
        if (r.family_member_id) return false
      } else if (memberFilter !== 'all') {
        if (r.family_member_id !== memberFilter) return false
      }

      if (q) {
        const haystack = [
          r.title || '',
          r.ai_summary || '',
          ...(r.tags || []),
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [records, search, memberFilter, criticalOnly])

  const recordsByType = useMemo(() => {
    const map: Record<RecordRow['type'], RecordRow[]> = {
      lab_report: [], prescription: [], xray: [], scan: [], consultation: [], other: []
    }
    filteredRecords.forEach(r => {
      if (map[r.type]) map[r.type].push(r)
    })
    return map
  }, [filteredRecords])

  const totalCount = filteredRecords.length
  const criticalCount = records.filter(r => r.is_critical).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 to-green-50/40">
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-3">
              <Link href="/patient/dashboard">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Health Records</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'record' : 'records'}
              {criticalCount > 0 && (
                <> · <span className="text-destructive font-medium">{criticalCount} critical</span></>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search title, summary, tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="self">Myself only</SelectItem>
                  {familyMembers.map(fm => (
                    <SelectItem key={fm.id} value={fm.id}>
                      {fm.full_name} ({fm.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={criticalOnly ? 'default' : 'outline'}
                onClick={() => setCriticalOnly(v => !v)}
                size="sm"
                className="md:w-auto"
              >
                <ShieldAlert className="size-4" />
                Critical only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Folders */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="lab_report">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 flex-wrap">
              {TYPE_KEYS.map(t => {
                const meta = TYPE_META[t]
                const Icon = meta.icon
                return (
                  <TabsTrigger key={t} value={t} className="gap-2">
                    <Icon className={`size-4 ${meta.color}`} />
                    <span>{meta.label}</span>
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {recordsByType[t].length}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {TYPE_KEYS.map(t => (
              <TabsContent key={t} value={t} className="mt-6">
                {recordsByType[t].length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      {(() => { const Icon = TYPE_META[t].icon; return <Icon className={`size-10 mx-auto mb-3 ${TYPE_META[t].color} opacity-40`} /> })()}
                      <p className="text-sm text-muted-foreground">
                        No {TYPE_META[t].label.toLowerCase()} {records.length > 0 && (search || criticalOnly || memberFilter !== 'all') ? 'match your filters' : 'yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recordsByType[t].map(r => (
                      <RecordCard key={r.id} record={r} onOpen={() => setOpenRecordId(r.id)} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <HealthRecordViewerSheet
        record={openRecord}
        onClose={() => setOpenRecordId(null)}
        onDeleted={() => { setOpenRecordId(null); loadAll() }}
        onReanalyze={() => { loadAll() }}
      />
    </div>
  )
}

function RecordCard({ record, onOpen }: { record: RecordRow; onOpen: () => void }) {
  const Icon = TYPE_META[record.type].icon
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={onOpen}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={`size-4 shrink-0 ${TYPE_META[record.type].color}`} />
            <p className="font-medium text-sm truncate">{record.title}</p>
          </div>
          {record.is_critical && (
            <Badge variant="destructive" className="text-[10px] shrink-0">Critical</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span>{new Date(record.date_recorded).toLocaleDateString()}</span>
          {record.family_members && (
            <>
              <span>·</span>
              <span className="truncate">For {record.family_members.full_name}</span>
            </>
          )}
        </div>

        {record.ai_summary ? (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {record.ai_summary}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic flex items-center gap-1">
            <Sparkles className="size-3" />
            Awaiting AI analysis
          </p>
        )}

        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {record.tags.slice(0, 4).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
            {record.tags.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{record.tags.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

