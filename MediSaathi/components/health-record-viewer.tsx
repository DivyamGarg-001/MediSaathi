'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Pill,
  Bone,
  ScanLine,
  Stethoscope,
  Files,
  Download,
  Sparkles,
  Loader2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  MessageSquare,
  X,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

export type FamilyMemberSummary = { id: string; full_name: string; relationship: string }

export type HealthRecord = {
  id: string
  title: string
  type: 'lab_report' | 'prescription' | 'xray' | 'scan' | 'consultation' | 'other'
  date_recorded: string
  created_at?: string
  file_url: string | null
  file_type: string | null
  ai_summary: string | null
  tags: string[] | null
  is_critical: boolean | null
  family_member_id: string | null
  family_members?: FamilyMemberSummary | null
  content?: string | null
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const RECORD_TYPE_META: Record<HealthRecord['type'], { label: string; icon: any; color: string }> = {
  lab_report:   { label: 'Lab Reports',    icon: FileText,    color: 'text-emerald-600' },
  prescription: { label: 'Prescriptions',  icon: Pill,        color: 'text-purple-600' },
  xray:         { label: 'X-rays',         icon: Bone,        color: 'text-orange-600' },
  scan:         { label: 'Scans',          icon: ScanLine,    color: 'text-blue-600' },
  consultation: { label: 'Consultations',  icon: Stethoscope, color: 'text-rose-600' },
  other:        { label: 'Other',          icon: Files,       color: 'text-slate-600' },
}

export const RECORD_TYPE_KEYS: HealthRecord['type'][] = [
  'lab_report', 'prescription', 'xray', 'scan', 'consultation', 'other'
]

export function HealthRecordViewerSheet({
  record,
  onClose,
  onDeleted,
  onReanalyze,
}: {
  record: HealthRecord | null
  onClose: () => void
  /** When provided, a Delete button is shown that calls DELETE /api/health-records and invokes this callback on success. Omit to hide deletion (e.g. for doctors). */
  onDeleted?: () => void
  /** When provided, a Re-analyze button is shown that re-runs AI analysis. The callback is invoked on success so the parent can refresh data. */
  onReanalyze?: () => void
}) {
  const [imageZoom, setImageZoom] = useState(1)
  const [deleting, setDeleting] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  // Reset transient state when switching records
  useEffect(() => {
    setImageZoom(1)
    setChatOpen(false)
    setChatMessages([])
    setChatInput('')
  }, [record?.id])

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages, chatSending])

  const isImage = record?.file_type?.startsWith('image/') ?? false
  const isPdf = record?.file_type === 'application/pdf'
  const hasContent = !!(record?.content && record.content.trim().length > 0)

  async function handleDelete() {
    if (!record || !onDeleted) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/health-records?recordId=${record.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Could not delete record')
        return
      }
      toast.success('Record deleted')
      onDeleted()
    } catch {
      toast.error('Could not delete record')
    } finally {
      setDeleting(false)
    }
  }

  async function handleReanalyze() {
    if (!record || !onReanalyze) return
    setReanalyzing(true)
    try {
      const res = await fetch('/api/ai/records/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: record.id }),
      })
      const json = await res.json()
      if (json?.success) {
        const criticalCount = json.critical_findings?.length || 0
        if (criticalCount > 0) {
          toast.warning(`AI analysis updated — ${criticalCount} critical finding${criticalCount > 1 ? 's' : ''}`, { duration: 7000 })
        } else {
          toast.success('AI analysis updated')
        }
        onReanalyze()
      } else if (json?.skipped) {
        toast.message(json.error || 'AI analysis skipped for this file type')
      } else {
        toast.error(json?.error || 'AI analysis failed')
      }
    } catch {
      toast.error('AI service unavailable. Make sure the FastAPI backend is running.')
    } finally {
      setReanalyzing(false)
    }
  }

  async function handleSendChat() {
    if (!record || !chatInput.trim() || chatSending) return
    const question = chatInput.trim()
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: question }]
    setChatMessages(newMessages)
    setChatInput('')
    setChatSending(true)
    try {
      const res = await fetch('/api/ai/records/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_id: record.id,
          question,
          // Send up to last 6 messages of context (excludes the just-added user msg, server adds it)
          history: chatMessages.slice(-6),
        }),
      })
      const json = await res.json()
      if (json?.success && json.answer) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: json.answer }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: json?.error || 'Sorry, I could not answer that.' }])
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'AI service unavailable.' }])
    } finally {
      setChatSending(false)
    }
  }

  return (
    <Sheet open={!!record} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        className={`w-full flex flex-col p-0 gap-0 transition-[max-width] ${chatOpen ? 'sm:max-w-5xl lg:max-w-6xl' : 'sm:max-w-3xl lg:max-w-4xl'}`}
      >
        {record && (
          <>
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="flex items-center gap-2 truncate">
                    {(() => { const Icon = RECORD_TYPE_META[record.type].icon; return <Icon className={`size-5 ${RECORD_TYPE_META[record.type].color}`} /> })()}
                    <span className="truncate">{record.title}</span>
                    {record.is_critical && (
                      <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                    )}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 flex-wrap">
                    <span>{RECORD_TYPE_META[record.type].label}</span>
                    <span>·</span>
                    <span>{new Date(record.date_recorded).toLocaleDateString()}</span>
                    {record.family_members && (
                      <>
                        <span>·</span>
                        <span>For {record.family_members.full_name} ({record.family_members.relationship})</span>
                      </>
                    )}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    variant={chatOpen ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChatOpen(v => !v)}
                    disabled={!hasContent}
                    title={hasContent ? 'Chat with AI about this record' : 'No extracted text — run AI analysis first (PDFs only)'}
                  >
                    <MessageSquare className="size-4" />
                    {chatOpen ? 'Close chat' : 'Ask AI'}
                  </Button>
                  {onReanalyze && isPdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReanalyze}
                      disabled={reanalyzing}
                      title="Re-run AI analysis on this record"
                    >
                      {reanalyzing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Re-analyze
                    </Button>
                  )}
                  {record.file_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={record.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="size-4" />
                        Download
                      </a>
                    </Button>
                  )}
                  {onDeleted && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{record.title}" will be permanently removed from your health records, along with the uploaded file. This can't be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {record.ai_summary && (
                <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="size-3.5 text-primary" />
                    <p className="text-xs font-medium text-primary">AI summary</p>
                  </div>
                  <p className="text-sm text-foreground/80">{record.ai_summary}</p>
                </div>
              )}

              {record.tags && record.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {record.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </SheetHeader>

            <div className="flex-1 flex min-h-0">
              {/* Document viewer */}
              <div className={`flex-1 overflow-auto bg-muted/30 ${chatOpen ? 'hidden md:block' : ''}`}>
                {!record.file_url ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
                    No file attached to this record
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={record.file_url}
                    className="w-full h-full min-h-[600px] bg-white"
                    title={record.title}
                  />
                ) : isImage ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 p-3 border-b bg-background">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageZoom(z => Math.max(0.25, z - 0.25))}
                        disabled={imageZoom <= 0.25}
                      >
                        <ZoomOut className="size-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageZoom(z => Math.min(4, z + 0.25))}
                        disabled={imageZoom >= 4}
                      >
                        <ZoomIn className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageZoom(1)}
                        disabled={imageZoom === 1}
                        className="ml-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                      <img
                        src={record.file_url}
                        alt={record.title}
                        style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top center', transition: 'transform 150ms ease-out' }}
                        className="max-w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                    <FileText className="size-10 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      This file type can't be previewed in the browser.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a href={record.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="size-4" />
                        Download to view
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Chat panel */}
              {chatOpen && (
                <div className="w-full md:w-96 md:border-l flex flex-col bg-background min-h-0">
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <p className="text-sm font-medium">Ask AI about this record</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)} className="md:hidden">
                      <X className="size-4" />
                    </Button>
                  </div>

                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMessages.length === 0 && !chatSending ? (
                      <div className="text-center py-6">
                        <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Ask any question about this report. The AI uses only the document's content.
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-2">
                          E.g. "What was my cholesterol level?" or "Are any values out of range?"
                        </p>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {chatSending && (
                          <div className="flex justify-start">
                            <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground flex items-center gap-2">
                              <Loader2 className="size-3 animate-spin" />
                              Thinking…
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-3 border-t space-y-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendChat()
                        }
                      }}
                      placeholder="Ask about this record..."
                      rows={2}
                      disabled={chatSending}
                      className="text-sm resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">
                        AI is not a doctor — verify clinical decisions with your physician.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSendChat}
                        disabled={!chatInput.trim() || chatSending}
                      >
                        {chatSending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
