'use client'

import { useEffect, useState } from 'react'
import { Mail, MailOpen, Archive, Trash2, ArrowLeft, Send, Check, AlertCircle, Info } from 'lucide-react'
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
  const [sending, setSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ show: boolean; type: 'success' | 'warning' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  })

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

      // Mettre à jour l'interface avec la nouvelle réponse
      const newReply = { from: 'REKOMA', body: reply, at: new Date().toISOString() }
      const updated = {
        ...selected,
        replies: [...selected.replies, newReply],
        read: true
      }

      setMessages((list) => list.map((x) => (x.id === selected.id ? updated : x)))
      setSelected(updated)
      setReply('')

      // Analyser le résultat de l'email
      const emailOk = d?.email?.success !== false
      const emailError = d?.email?.error
      const devRedirect = d?.email?.devRedirect || false
      const originalTo = d?.email?.originalTo || null

      let message = ''
      let type: 'success' | 'warning' | 'error' = 'success'

      if (emailOk && !devRedirect) {
        message = '✅ Réponse envoyée avec succès par email'
        type = 'success'
      } else if (emailOk && devRedirect) {
        message = `✅ Réponse enregistrée et email envoyé (Mode DEV: redirigé vers votre adresse)`
        type = 'success'
      } else if (!emailOk && devRedirect) {
        message = `⚠️ Réponse enregistrée mais email redirigé en mode DEV. L'email original devait être envoyé à ${originalTo || 'inconnu'}`
        type = 'error'
      } else {
        // Gérer les différentes erreurs Resend
        if (emailError?.includes('verify a domain')) {
          message = `⚠️ Réponse enregistrée mais email non envoyé. Pour envoyer des emails à d'autres destinataires, vérifiez un domaine sur resend.com/domains`
          type = 'error'
        } else if (emailError?.includes('only send testing emails to your own email')) {
          message = `⚠️ Mode test: vous ne pouvez envoyer des emails qu'à votre propre adresse (andrianisaina23@gmail.com). Utilisez DEV_EMAIL_MODE=true en développement.`
          type = 'error'
        } else {
          message = `⚠️ Réponse enregistrée mais email non envoyé : ${emailError || 'erreur inconnue'}`
          type = 'error'
        }
      }

      // Afficher le toast
      toast(message, type)

      // Afficher le statut détaillé
      setEmailStatus({
        show: true,
        type,
        message: message + (devRedirect ? ' 🔄' : '')
      })

      // Effacer le statut après 10 secondes
      setTimeout(() => {
        setEmailStatus({ show: false, type: 'success', message: '' })
      }, 10000)

    } catch (e: any) {
      const errorMsg = e?.message || 'Erreur lors de l\'envoi de la réponse'
      toast(errorMsg, 'error')
      setEmailStatus({
        show: true,
        type: 'error',
        message: `❌ ${errorMsg}`
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
    }
  }

  const list = filtered()

  // Fonction pour obtenir le badge de statut d'email
  function getEmailStatusBadge() {
    if (!emailStatus.show) return null

    const colors = {
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      error: 'bg-red-100 text-red-800 border-red-300'
    }

    const icons = {
      success: <Check className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      error: <AlertCircle className="h-4 w-4" />
    }

    return (
      <div className={`mt-2 flex items-center gap-2 rounded-lg border p-3 text-sm ${colors[emailStatus.type]}`}>
        {icons[emailStatus.type]}
        <span>{emailStatus.message}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.messages}</h1>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.admin.search}
            className="h-10 rounded-full border border-input bg-background pl-4 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'unread', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            {f === 'all' ? t.admin.nav.messages : f === 'unread' ? t.admin.unread : t.admin.archive}
          </button>
        ))}
      </div>

      {messages.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">{t.admin.noMessages}</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {list.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); patch(m, { read: true }) }}
                className={cn(
                  'block w-full rounded-xl border p-4 text-left transition-all',
                  selected?.id === m.id
                    ? 'border-primary bg-secondary shadow-sm'
                    : 'border-border hover:bg-secondary/60'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{m.name}</span>
                  {!m.read && !m.archived && <span className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="truncate text-sm text-muted-foreground">{m.subject || t.contact.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </p>
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
                      <button
                        onClick={() => patch(selected, { archived: !selected.archived })}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        <Archive className="h-4 w-4" /> {t.admin.archive}
                      </button>
                      <button
                        onClick={() => del(selected)}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Message original</span>
                      <span className="text-xs text-muted-foreground">
                        {selected.createdAt ? new Date(selected.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{selected.body}</p>
                  </div>

                  {selected.replies.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        {selected.replies.length} réponse{selected.replies.length > 1 ? 's' : ''}
                      </p>
                      {selected.replies.map((r, i) => (
                        <div key={i} className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-primary">{r.from}</p>
                            <span className="text-xs text-muted-foreground">
                              {r.at ? new Date(r.at).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="reply-to">À</Label>
                        <Input
                          id="reply-to"
                          type="email"
                          value={selected.email}
                          readOnly
                          className="bg-secondary/40"
                        />
                      </div>
                      <div>
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
                    <div>
                      <Label htmlFor="reply-body">Votre réponse</Label>
                      <Textarea
                        id="reply-body"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Écrivez votre réponse…"
                        rows={5}
                        className="resize-none"
                      />
                    </div>

                    {/* Affichage du statut d'envoi */}
                    {emailStatus.show && getEmailStatusBadge()}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        className={cn(
                          buttonVariants({ size: 'sm' }),
                          'min-w-[140px]',
                          (sending || !reply.trim()) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {sending ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer la réponse
                          </>
                        )}
                      </button>
                      {sending && (
                        <span className="text-sm text-muted-foreground">
                          Veuillez patienter...
                        </span>
                      )}
                    </div>

                    {/* Info mode développement */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200 flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Mode Développement</p>
                          <p className="text-xs text-blue-700">
                            Les emails sont redirigés vers votre adresse de développement.
                            Pour envoyer à d'autres adresses, vérifiez un domaine sur resend.com/domains.
                          </p>
                        </div>
                      </div>
                    )}
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