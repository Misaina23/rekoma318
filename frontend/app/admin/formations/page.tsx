'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, GraduationCap, Users, Download, FileText } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { remoteFormations, remoteBeneficiaries } from '@/lib/server/remote'

type Formation = {
  id: string
  title: string
  description?: string | null
  session?: string | null
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  trainer?: string | null
  date: string
  participants: number
  attendees: number
  evaluation: number
  certificate: boolean
  status: 'planned' | 'ongoing' | 'done'
  beneficiaries?: Array<{ id: string; firstName: string; lastName: string; cin?: string | null; phone?: string | null; address?: string | null; status?: string | null; attendance?: string | null }>
}

const STATUS: Formation['status'][] = ['planned', 'ongoing', 'done']

export default function FormationsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Formation[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Formation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Formation | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')
  const [showBeneficiaries, setShowBeneficiaries] = useState(false)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const data = await remoteFormations.list(debouncedQ || undefined, status || undefined, undefined, undefined, String(page)).catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }, [debouncedQ, status, page])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedQ(q)
      setPage(1)
    }, 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [q])

  useEffect(() => { load() }, [load])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/formations/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) { toast(t.admin.delete + ' ✓', 'success'); load() } else toast(t.admin.delete, 'error')
  }

  async function openBeneficiaries(formation: Formation) {
    setSelected(formation)
    setShowBeneficiaries(true)
  }

  async function generateCertificates(formation: Formation) {
    if (!formation.beneficiaries || formation.beneficiaries.length === 0) {
      toast('Aucun bénéficiaire dans cette formation.', 'error')
      return
    }
    const confirmed = await confirmDialog(`Cette formation contient ${formation.beneficiaries.length} bénéficiaire(s). Voulez-vous générer les ${formation.beneficiaries.length} attestation(s) ?`)
    if (!confirmed) return

    try {
      const r = await fetch(`/api/admin/formations/${formation.id}/certificates`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d?.url) {
        window.open(d.url, '_blank')
        toast('Attestations générées ✓', 'success')
      } else {
        toast(d?.error || 'Erreur lors de la génération', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.admin.nav.formations}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une formation..." className="pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Tous statuts</option>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.session} · {new Date(f.date).toLocaleDateString('fr-FR')}</p>
                  {f.location && <p className="text-xs text-muted-foreground">Lieu : {f.location}</p>}
                  {f.trainer && <p className="text-xs text-muted-foreground">Formateur : {f.trainer}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openBeneficiaries(f)} className="rounded-lg p-2 hover:bg-secondary" title="Bénéficiaires"><Users className="h-4 w-4" /></button>
                  <button onClick={() => generateCertificates(f)} className="rounded-lg p-2 hover:bg-secondary" title="Attestations"><FileText className="h-4 w-4" /></button>
                  <button onClick={() => { setEditing(f); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(f.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {f.description && <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="muted">Participants: {f.participants}</Badge>
                <Badge variant="muted">Présents: {f.attendees}</Badge>
                <Badge variant="muted">Note: {f.evaluation}/5</Badge>
                {f.certificate && <Badge variant="accent">Attestation</Badge>}
                <Badge variant="outline">{f.status}</Badge>
              </div>
              {(f.startDate || f.endDate) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Du {f.startDate ? new Date(f.startDate).toLocaleDateString('fr-FR') : '...'} au {f.endDate ? new Date(f.endDate).toLocaleDateString('fr-FR') : '...'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Card><CardContent className="p-10 text-center text-muted-foreground">Aucune formation.</CardContent></Card>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Précédent</button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Suivant</button>
        </div>
      )}

      {showForm && <FormationForm formation={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}

      {showBeneficiaries && selected && (
        <FormationBeneficiaries formation={selected} onClose={() => { setShowBeneficiaries(false); setSelected(null) }} onUpdated={() => load()} />
      )}
    </div>
  )
}

function FormationForm({ formation, onClose, onSaved }: { formation: Formation | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    title: formation?.title || '',
    description: formation?.description || '',
    session: formation?.session || '',
    startDate: formation?.startDate ? new Date(formation.startDate).toISOString().slice(0, 10) : '',
    endDate: formation?.endDate ? new Date(formation.endDate).toISOString().slice(0, 10) : '',
    location: formation?.location || '',
    trainer: formation?.trainer || '',
    date: formation?.date ? new Date(formation.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    participants: formation?.participants || 0,
    attendees: formation?.attendees || 0,
    evaluation: formation?.evaluation || 0,
    certificate: formation?.certificate || false,
    status: formation?.status || 'planned',
  })
  const [saving, setSaving] = useState(false)
  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    const method = formation ? 'PATCH' : 'POST'
    const url = formation ? `/api/admin/formations/${formation.id}` : '/api/admin/formations'
    const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(form), credentials: 'include' })
    setSaving(false)
    if (r.ok) { toast(t.admin.save + ' ✓', 'success'); onSaved() } else toast(t.admin.save, 'error')
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{formation ? t.admin.edit : t.admin.new}</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label={t.admin.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Session"><Input value={form.session} onChange={(e) => set('session', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date début"><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
            <Field label="Date fin"><Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lieu"><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Formateur"><Input value={form.trainer} onChange={(e) => set('trainer', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.admin.date}><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label={t.admin.status}>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.admin.participants}><Input type="number" value={form.participants} onChange={(e) => set('participants', Number(e.target.value))} /></Field>
            <Field label={t.admin.attendees}><Input type="number" value={form.attendees} onChange={(e) => set('attendees', Number(e.target.value))} /></Field>
            <Field label={t.admin.evaluation}><Input type="number" value={form.evaluation} onChange={(e) => set('evaluation', Number(e.target.value))} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.certificate} onChange={(e) => set('certificate', e.target.checked)} />
            {t.admin.certificate}
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}><Check className="h-4 w-4" /> {t.admin.save}</button>
        </div>
      </div>
    </div>
  )
}

function FormationBeneficiaries({ formation, onClose, onUpdated }: { formation: Formation; onClose: () => void; onUpdated: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [list, setList] = useState<Formation['beneficiaries']>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    setList(formation.beneficiaries || [])
  }, [formation])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return list || []
    return (list || []).filter((b) => `${b.firstName} ${b.lastName} ${b.cin ?? ''} ${b.phone ?? ''} ${b.address ?? ''}`.toLowerCase().includes(term))
  }, [list, q])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/beneficiaries/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) { toast('Supprimé ✓', 'success'); setList((prev = []) => prev.filter((x) => x.id !== id)); onUpdated() } else toast(t.admin.delete, 'error')
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Bénéficiaires — {formation.title}</h2>
            <p className="text-xs text-muted-foreground">{(list || []).length} bénéficiaire(s)</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher nom, prénom, CIN, téléphone, adresse..." className="pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Nom</th>
                  <th className="p-3 font-medium">Prénom</th>
                  <th className="p-3 font-medium">CIN</th>
                  <th className="p-3 font-medium">Téléphone</th>
                  <th className="p-3 font-medium">Adresse</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Présence</th>
                  <th className="p-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(filtered || []).map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{b.lastName}</td>
                    <td className="p-3 font-medium">{b.firstName}</td>
                    <td className="p-3 text-muted-foreground">{b.cin || '—'}</td>
                    <td className="p-3 text-muted-foreground">{b.phone || '—'}</td>
                    <td className="p-3 text-muted-foreground">{b.address || '—'}</td>
                    <td className="p-3"><Badge variant={b.status === 'inactive' ? 'muted' : 'default'}>{b.status === 'inactive' ? 'Inactif' : 'Actif'}</Badge></td>
                    <td className="p-3 text-muted-foreground">{b.attendance || '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => remove(b.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary" aria-label={t.admin.delete}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {(!filtered || filtered.length === 0) && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Aucun bénéficiaire.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}
