'use client'

import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { remoteCms } from '@/lib/server/remote'

type Activity = {
  id: string
  title: string
  responsible: string
  date: string
  budget: number
  objectives: string
  participants: number
  results: string
  status: 'planned' | 'ongoing' | 'done'
}

const STATUS: Activity['status'][] = ['planned', 'ongoing', 'done']
const STATUS_LABELS: Record<Activity['status'], string> = {
  planned: 'Planifiée',
  ongoing: 'En cours',
  done: 'Terminée',
}

export default function ActivitiesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Activity[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const data = await remoteCms
      .activities(q || undefined, status || undefined, String(page))
      .catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }
  useEffect(() => {
    load()
  }, [q, status, page])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
    const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : null
    const r = await fetch(`/api/admin/activities/${id}`, {
      method: 'DELETE',
      headers: valid ? { authorization: `Bearer ${valid}` } : {},
      credentials: 'include',
    })
    if (r.ok) {
      toast(t.admin.delete + ' ✓', 'success')
      load()
    } else toast(t.admin.delete, 'error')
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
    [items]
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.activities}</h1>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] w-full sm:min-h-[38px] sm:w-auto')}
        >
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-48"
        >
          <option value="">Tous statuts</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] || s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        {sorted.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums sm:text-sm">
                    {[a.responsible, a.date].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary">
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
                <span>
                  {t.admin.budget} : <strong className="text-foreground">{a.budget.toLocaleString('fr-FR')} Ar</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t.admin.participants} : <strong className="text-foreground">{a.participants}</strong>
                </span>
              </div>

              {a.results && <p className="mt-2.5 text-sm text-muted-foreground">{a.results}</p>}

              <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <button
                  onClick={() => {
                    setEditing(a)
                    setShowForm(true)
                  }}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive hover:bg-destructive/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">{t.search.empty}</CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
          >
            Précédent
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
          >
            Suivant
          </button>
        </div>
      )}

      {showForm && (
        <ActivityForm
          activity={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function ActivityForm({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    title: activity?.title || '',
    responsible: activity?.responsible || '',
    date: activity?.date || new Date().toISOString().slice(0, 10),
    budget: activity?.budget || 0,
    objectives: activity?.objectives || '',
    participants: activity?.participants || 0,
    results: activity?.results || '',
    status: activity?.status || 'planned',
  })
  const [saving, setSaving] = useState(false)
  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit() {
    setSaving(true)
    const method = activity ? 'PATCH' : 'POST'
    const url = activity ? `/api/admin/activities/${activity.id}` : '/api/admin/activities'
    const r = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (r.ok) {
      toast(t.admin.save + ' ✓', 'success')
      onSaved()
    } else toast(t.admin.save, 'error')
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl pb-safe sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-semibold">{activity ? t.admin.edit : t.admin.new}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label={t.admin.title}>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label={t.admin.responsible}>
            <Input value={form.responsible} onChange={(e) => set('responsible', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.admin.date}>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label={t.admin.status}>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.admin.budget}>
              <Input type="number" value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} />
            </Field>
            <Field label={t.admin.participants}>
              <Input type="number" value={form.participants} onChange={(e) => set('participants', Number(e.target.value))} />
            </Field>
          </div>
          <Field label={t.admin.results}>
            <Textarea value={form.results} onChange={(e) => set('results', e.target.value)} />
          </Field>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[46px] w-full sm:w-auto')}>
            {t.admin.cancel}
          </button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}), 'min-h-[46px] w-full sm:w-auto')}>
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
