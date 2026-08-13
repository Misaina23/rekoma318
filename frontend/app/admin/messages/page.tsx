'use client'

import { useEffect, useState } from 'react'
import { Mail, MailOpen, Archive, Trash2, ArrowLeft, Send, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Textarea, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Msg = {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  body: string
  createdAt: string
  read: boolean
  archived: boolean
  replies: { from: string; body: string; at: string }[]
}

export default function AdminMessagesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [messages, setMessages] = useState<Msg[]>([])
  const [selected, setSelected] = useState<Msg | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [q, setQ] = useState('')
  const [reply, setReply] = useState('')

  async function load() {
    const r = await fetch('/api/admin/messages')
    if (r.ok) {
      const data: Msg[] = await r.json()
      setMessages(data)
      setSelected((s) => data.find((m) => s?.id === m.id) || data[0] || null)
    }
  }
  useEffect(() => { load() }, [])

  function filtered() {
    const term = q.trim().toLowerCase()
    return messages.filter((m) => {
      if (filter === 'unread' && (m.read || m.archived)) return false
      if (filter === 'archived' && !m.archived) return false
      if (filter === 'all' && m.archived) return false
      if (term && !`${m.name} ${m.email} ${m.subject}`.toLowerCase().includes(term)) return false
      return true
    })
  }

  async function patch(m: Msg, body: any) {
    const r = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: m.id, ...body }),
    })
    if (r.ok) { setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, ...body } : x))); setSelected((s) => (s?.id === m.id ? { ...s, ...body } : s)) }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    const replies = [...selected.replies, { from: 'REKOMA', body: reply, at: new Date().toISOString() }]
    await patch(selected, { replies, read: true })
    setReply('')
    toast(t.admin.reply + ' ✓', 'success')
  }

  async function del(m: Msg) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' })
    if (r.ok) { toast(t.admin.delete + ' ✓', 'success'); setMessages((l) => l.filter((x) => x.id !== m.id)); setSelected(null) }
  }

  const list = filtered()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.messages}</h1>
        <div className="relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.admin.search} className="h-10 rounded-full border border-input bg-background pl-4 pr-4 text-sm outline-none" />
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'unread', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium', filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
          >
            {f === 'all' ? t.admin.nav.messages : f === 'unread' ? t.admin.unread : t.admin.archive}
          </button>
        ))}
      </div>

      {messages.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">{t.admin.noMessages}</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="space-y-2">
            {list.map((m) => (
              <button key={m.id} onClick={() => { setSelected(m); patch(m, { read: true }) }} className={cn('block w-full rounded-xl border p-4 text-left', selected?.id === m.id ? 'border-primary bg-secondary' : 'border-border hover:bg-secondary/60')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{m.name}</span>
                  {!m.read && !m.archived && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="truncate text-sm text-muted-foreground">{m.subject || t.contact.message}</p>
              </button>
            ))}
          </div>

          <div>
            {selected ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{selected.name}</h2>
                      <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline">{selected.email}</a>
                      {selected.phone && <p className="text-sm text-muted-foreground">{selected.phone}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => patch(selected, { archived: !selected.archived })} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        <Archive className="h-4 w-4" /> {t.admin.archive}
                      </button>
                      <button onClick={() => del(selected)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm">{selected.body}</div>

                  {selected.replies.map((r, i) => (
                    <div key={i} className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                      <p className="text-xs font-semibold text-primary">{r.from}</p>
                      <p className="mt-1">{r.body}</p>
                    </div>
                  ))}

                  <div className="mt-4 space-y-2">
                    <Label>{t.admin.reply}</Label>
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="..." />
                    <button onClick={sendReply} className={cn(buttonVariants({ size: 'sm' }))}>
                      <Send className="h-4 w-4" /> {t.admin.reply}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-10 text-center text-muted-foreground">{t.admin.noMessages}</CardContent></Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
