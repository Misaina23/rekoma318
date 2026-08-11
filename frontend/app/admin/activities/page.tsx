'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

export default function ActivitiesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Activity[]>([])
  const [editing, setEditing] = useState<Activity | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() { const r = await fetch('/api/admin/activities'); if (r.ok) setItems(await r.json()) }
  useEffect(() => { load() }, [])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/activities/${id}`, { method: 'DELETE' })
    if (r.ok) { toast(t.admin.delete + ' ✓', 'success'); load() } else toast(t.admin.delete, 'error')
  }

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.admin.nav.activities}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.responsible} · {a.date}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(a); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(a.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="muted">{t.admin.budget}: {a.budget.toLocaleString()} Ar</Badge>
                <Badge variant="muted">{t.admin.participants}: {a.participants}</Badge>
                <Badge variant={a.status === 'done' ? 'default' : 'outline'}>{t.admin.status}: {a.status}</Badge>
              </div>
              {a.results && <p className="mt-3 text-sm text-muted-foreground">{a.results}</p>}
            </CardContent>
          </Card>
        ))}
        {sorted.length === 0 && <Card><CardContent className="p-10 text-center text-muted-foreground">{t.search.empty}</CardContent></Card>}
      </div>

      {showForm && (
        <ActivityForm activity={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function ActivityForm({ activity, onClose, onSaved }: { activity: Activity | null; onClose: () => void; onSaved: () => void }) {
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
  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    const method = activity ? 'PATCH' : 'POST'
    const url = activity ? `/api/admin/activities/${activity.id}` : '/api/admin/activities'
    const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (r.ok) { toast(t.admin.save + ' ✓', 'success'); onSaved() } else toast(t.admin.save, 'error')
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{activity ? t.admin.edit : t.admin.new}</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label={t.admin.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label={t.admin.responsible}><Input value={form.responsible} onChange={(e) => set('responsible', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.admin.date}><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label={t.admin.status}>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.admin.budget}><Input type="number" value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} /></Field>
            <Field label={t.admin.participants}><Input type="number" value={form.participants} onChange={(e) => set('participants', Number(e.target.value))} /></Field>
          </div>
          <Field label={t.admin.results}><Textarea value={form.results} onChange={(e) => set('results', e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}><Check className="h-4 w-4" /> {t.admin.save}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}
