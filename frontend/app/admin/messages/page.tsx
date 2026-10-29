'use client'

import { useEffect, useState } from 'react'
import { Archive, Trash2, ArrowLeft, Send, Check, AlertCircle, Info, Search } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Textarea, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const toast = useToast()
  const [messages, setMessages] = useState<Msg[]>([])
  const [selected, setSelected] = useState<Msg | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [q, setQ] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  })

  async function load() {
    const r = await fetch('/api/admin/messages')
    if (r.ok) {
      const data: Msg[] = await r.json()
      setMessages(data)
      setSelected((s) => data.find((m) => s?.id === m.id) || data[0] || null)
    }
  }
  useEffect(() => {
    load()
  }, [])

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
    if (r.ok) {
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, ...body } : x)))
      setSelected((s) => (s?.id === m.id ? { ...s, ...body } : s))
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return

    setSending(true)
    setEmailStatus({ show: false, type: 'success', message: '' })

    try {
      const r = await fetch(`/api/admin/messages/${selected.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      const d = await r.json().catch(() => ({}))

      if (!r.ok) throw new Error(d?.message || 'Erreur envoi')

      const newReply = { from: 'REKOMA', body: reply, at: new Date().toISOString() }
      const updated = {
        ...selected,
        replies: [...selected.replies, newReply],
        read: true,
      }

      setMessages((list) => list.map((x) => (x.id === selected.id ? updated : x)))
      setSelected(updated)
      setReply('')

      const emailOk = d?.email?.success !== false
      const emailError = d?.email?.error
      const devRedirect = d?.email?.devRedirect || false
      const originalTo = d?.email?.originalTo || null

      let message = ''
      let type: 'success' | 'error' = 'success'

      if (emailOk && !devRedirect) {
        message = 'Réponse envoyée avec succès par email.'
        type = 'success'
      } else if (emailOk && devRedirect) {
        message = 'Réponse enregistrée et email envoyé (Mode DEV : redirigé vers votre adresse).'
        type = 'success'
      } else if (!emailOk && devRedirect) {
        message = `Réponse enregistrée mais email redirigé en mode DEV (destinataire initial : ${originalTo || 'inconnu'}).`
        type = 'error'
      } else {
        if (emailError?.includes('verify a domain')) {
          message = "Réponse enregistrée mais email non envoyé. Vérifiez un domaine sur resend.com/domains."
          type = 'error'
        } else if (emailError?.includes('only send testing emails to your own email')) {
          message = "Mode test : envoi limité à votre propre adresse (andrianisaina23@gmail.com)."
          type = 'error'
        } else {
          message = `Réponse enregistrée mais email non envoyé : ${emailError || 'erreur inconnue'}`
          type = 'error'
        }
      }

      toast(message, type)
      setEmailStatus({ show: true, type, message })

      setTimeout(() => {
        setEmailStatus({ show: false, type: 'success', message: '' })
      }, 10000)
    } catch (e: any) {
      const errorMsg = e?.message || "Erreur lors de l'envoi de la réponse"
      toast(errorMsg, 'error')
      setEmailStatus({
        show: true,
        type: 'error',
        message: errorMsg,
      })
    } finally {
      setSending(false)
    }
  }

  async function del(m: Msg) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' })
    if (r.ok) {
      toast(t.admin.delete + ' ✓', 'success')
      setMessages((l) => l.filter((x) => x.id !== m.id))
      setSelected(null)
      setMobileDetailOpen(false)
    }
  }

  const list = filtered()

  function getEmailStatusBanner() {
    if (!emailStatus.show) return null
    const isOk = emailStatus.type === 'success'
    return (
      <div
        role="status"
        className={cn(
          'mt-2 flex items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm',
          isOk
            ? 'border-primary/35 bg-primary/10 text-foreground'
            : 'border-destructive/40 bg-destructive/10 text-destructive'
        )}
      >
        {isOk ? (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <span className="break-words leading-relaxed">{emailStatus.message}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.messages}</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.admin.search}
            className="pl-9"
          />
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="inline-flex w-full rounded-xl bg-secondary p-1 sm:w-auto">
        {(['all', 'unread', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              setMobileDetailOpen(false)
            }}
            className={cn(
              'min-h-[38px] flex-1 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:text-sm',
              filter === f
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? t.admin.nav.messages : f === 'unread' ? t.admin.unread : t.admin.archive}
          </button>
        ))}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t.admin.noMessages}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Inbox List (Hidden on mobile when a conversation is opened) */}
          <div className={cn('space-y-2 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1', mobileDetailOpen && 'hidden lg:block')}>
            {list.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">{t.admin.noMessages}</CardContent>
              </Card>
            )}
            {list.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m)
                  setMobileDetailOpen(true)
                  patch(m, { read: true })
                }}
                className={cn(
                  'block w-full rounded-2xl border p-4 text-left transition-colors',
                  selected?.id === m.id
                    ? 'border-primary bg-card shadow-sm'
                    : 'border-border bg-card/60 hover:bg-card'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm', !m.read && !m.archived ? 'font-bold text-foreground' : 'font-semibold text-foreground')}>
                    {m.name}
                  </span>
                  {!m.read && !m.archived && (
                    <span className="shrink-0 text-[11px] font-semibold text-primary">Nouveau</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                  {m.subject || t.contact.message}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Conversation View */}
          <div className={cn(!mobileDetailOpen && 'hidden lg:block')}>
            {selected ? (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className="mb-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground hover:bg-secondary lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour aux messages
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold sm:text-lg">{selected.name}</h2>
                      <a href={`mailto:${selected.email}`} className="block truncate text-sm text-primary hover:underline">
                        {selected.email}
                      </a>
                      {selected.phone && (
                        <p className="text-xs text-muted-foreground tabular-nums sm:text-sm">{selected.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => patch(selected, { archived: !selected.archived })}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] flex-1 sm:flex-none')}
                      >
                        <Archive className="h-4 w-4" /> {t.admin.archive}
                      </button>
                      <button
                        onClick={() => del(selected)}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-3')}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-border bg-secondary/35 p-4 text-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                      <span className="font-semibold">Message reçu</span>
                      <span className="tabular-nums">
                        {selected.createdAt
                          ? new Date(selected.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{selected.body}</p>
                  </div>

                  {selected.replies.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {selected.replies.length} réponse{selected.replies.length > 1 ? 's' : ''}
                      </p>
                      {selected.replies.map((r, i) => (
                        <div key={i} className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-primary">{r.from}</p>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {r.at
                                ? new Date(r.at).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 space-y-3 border-t border-border pt-4">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="reply-to">À</Label>
                        <Input id="reply-to" type="email" value={selected.email} readOnly className="bg-secondary/40" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reply-subject">Objet</Label>
                        <Input
                          id="reply-subject"
                          type="text"
                          value={`RE: ${selected.subject || 'Votre message à REKOMA'}`}
                          readOnly
                          className="bg-secondary/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reply-body">Votre réponse</Label>
                      <Textarea
                        id="reply-body"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Écrivez votre réponse…"
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {getEmailStatusBanner()}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        className={cn(
                          buttonVariants({ size: 'sm' }),
                          'min-h-[46px] w-full sm:min-h-[40px] sm:w-auto sm:min-w-[160px]',
                          (sending || !reply.trim()) && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? 'Envoi en cours...' : 'Envoyer la réponse'}
                      </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="leading-relaxed">
                          Mode développement : les emails sont redirigés vers votre adresse administrateur tant qu&apos;un domaine expéditeur n&apos;est pas vérifié.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t.admin.noMessages}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}