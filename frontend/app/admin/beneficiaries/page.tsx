'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Download } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { remoteBeneficiaries, remoteFormations } from '@/lib/server/remote'

type Beneficiary = {
  id: string
  firstName: string
  lastName: string
  cin?: string | null
  birthDate?: string | null
  sex?: string | null
  phone?: string | null
  address?: string | null
  commune?: string | null
  name: string
  category: string
  formationId?: string | null
  formation?: { id: string; title: string } | null
  contact?: string | null
  status?: string | null
  attendance?: string | null
  createdAt?: string | null
}

const CATEGORIES = ['Distribution', 'Emploi', 'Formation', 'Autre']
const SEX_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
]

export default function BeneficiariesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Beneficiary[]>([])
  const [stats, setStats] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [category, setCategory] = useState('')
  const [formationId, setFormationId] = useState('')
  const [sex, setSex] = useState('')
  const [status, setStatus] = useState('')
  const [commune, setCommune] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formations, setFormations] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<Beneficiary | null>(null)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') || undefined : undefined
    const authHeader = token ? `Bearer ${token}` : undefined
    const [data, st, fm] = await Promise.all([
      remoteBeneficiaries.list(
        debouncedQ || undefined,
        category || undefined,
        formationId || undefined,
        status || undefined,
        sex || undefined,
        commune || undefined,
        String(page),
        authHeader,
      ).catch((e) => { console.error('remoteBeneficiaries.list failed', e); return { items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any }),
      remoteBeneficiaries.stats(authHeader).catch((e) => { console.error('remoteBeneficiaries.stats failed', e); return { total: 0, breakdown: {} } }),
      remoteFormations.list(undefined, undefined, undefined, undefined, authHeader).catch((e) => { console.error('remoteFormations.list failed', e); return [] }),
    ])
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
    setStats(st as any)
    setFormations((fm as any)?.items || [])
  }, [debouncedQ, category, formationId, status, sex, commune, page])

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

  const filtered = useMemo(() => items, [items])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    await remoteBeneficiaries.remove(id)
    toast('Supprimé ✓', 'success')
    load()
    if (selected?.id === id) setSelected(null)
  }

  function exportCsv() {
    const head = ['firstName', 'lastName', 'cin', 'birthDate', 'sex', 'phone', 'address', 'commune', 'category', 'contact', 'status', 'attendance']
    const rows = filtered.map((m) => head.map((h) => `"${String((m as any)[h] ?? '').replace(/"/g, '""')}"`).join(','))
    const csv = [head.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beneficiaires.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t.admin.nav.beneficiaries || 'Bénéficiaires'}</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          {CATEGORIES.map((c) => (
            <Card key={c}><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.breakdown?.[c] || 0}</p><p className="text-xs text-muted-foreground">{c}</p></CardContent></Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher nom, prénom, CIN, téléphone, adresse..." className="pl-9" />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={formationId} onChange={(e) => { setFormationId(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Toutes formations</option>
            {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={sex} onChange={(e) => { setSex(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            {SEX_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={commune} onChange={(e) => { setCommune(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Toutes communes</option>
            {Array.from(new Set(items.map((i) => i.commune).filter(Boolean))).map((c) => <option key={String(c)} value={String(c)}>{String(c)}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
            <Plus className="h-4 w-4" /> Nouveau
          </button>
        </div>
      </div>

      <div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium">Prénom</th>
                    <th className="p-4 font-medium">CIN</th>
                    <th className="p-4 font-medium">Catégorie</th>
                    <th className="p-4 font-medium">Formation</th>
                    <th className="p-4 font-medium">Contact</th>
                    <th className="p-4 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className={cn('border-b border-border last:border-0 cursor-pointer hover:bg-secondary/40', selected?.id === b.id && 'bg-secondary/60')} onClick={() => setSelected(b)}>
                      <td className="p-4 font-medium">{b.lastName}</td>
                      <td className="p-4 font-medium">{b.firstName}</td>
                      <td className="p-4 text-muted-foreground">{b.cin || '—'}</td>
                      <td className="p-4"><Badge variant="outline">{b.category}</Badge></td>
                      <td className="p-4 text-muted-foreground">{b.formation?.title || '—'}</td>
                      <td className="p-4 text-muted-foreground">{b.contact || '—'}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditing(b); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary" aria-label={t.admin.edit}><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => remove(b.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary" aria-label={t.admin.delete}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun bénéficiaire.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selected && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold">Détails</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="font-medium">{selected.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prénom</p>
                    <p className="font-medium">{selected.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CIN</p>
                    <p className="font-medium">{selected.cin || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sexe</p>
                    <p className="font-medium">{selected.sex === 'F' ? 'Féminin' : 'Masculin'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selected.phone || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{selected.address || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commune</p>
                    <p className="font-medium">{selected.commune || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Catégorie</p>
                    <Badge variant="outline">{selected.category}</Badge>
                  </div>
                  {selected.formation && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Formation</p>
                      <p className="font-medium">{selected.formation.title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium">{selected.contact || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <p className="font-medium">{selected.status === 'inactive' ? 'Inactif' : 'Actif'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Présence</p>
                    <p className="font-medium">{selected.attendance || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setEditing(selected); setShowForm(true) }} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}><Pencil className="mr-2 h-4 w-4" /> Modifier</button>
                  <button onClick={() => remove(selected.id)} className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Précédent</button>
        <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Suivant</button>
      </div>

      {showForm && (
        <BeneficiaryForm beneficiary={editing} formations={formations} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={() => { setShowForm(false); setEditing(null); load() }} />
      )}
    </div>
  )
}

function BeneficiaryForm({ beneficiary, formations, onClose, onSaved }: { beneficiary: Beneficiary | null; formations: { id: string; title: string }[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    firstName: beneficiary?.firstName || '',
    lastName: beneficiary?.lastName || '',
    cin: beneficiary?.cin || '',
    birthDate: beneficiary?.birthDate ? (() => { const d = new Date(beneficiary.birthDate); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) })() : '',
    sex: beneficiary?.sex || 'M',
    phone: beneficiary?.phone || '',
    address: beneficiary?.address || '',
    commune: beneficiary?.commune || '',
    name: beneficiary?.name || '',
    category: beneficiary?.category || 'Autre',
    formationId: beneficiary?.formationId || '',
    contact: beneficiary?.contact || '',
    status: beneficiary?.status || 'active',
    attendance: beneficiary?.attendance || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const body = { ...form, formationId: form.formationId || null }
      if (beneficiary) {
        await remoteBeneficiaries.update(beneficiary.id, body)
      } else {
        await remoteBeneficiaries.create(body)
      }
      toast('Enregistré ✓', 'success')
      onSaved()
    } catch (e: any) {
      const msg = e?.message || 'Erreur'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{beneficiary ? 'Modifier' : 'Nouveau bénéficiaire'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CIN</Label>
              <Input value={form.cin} onChange={(e) => set('cin', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de naissance</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <select value={form.sex} onChange={(e) => set('sex', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+261..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Commune</Label>
            <Input value={form.commune} onChange={(e) => set('commune', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nom complet</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Formation (optionnel)</Label>
              <select value={form.formationId} onChange={(e) => set('formationId', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">—</option>
                {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="+261..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Présence / participation</Label>
              <Input value={form.attendance} onChange={(e) => set('attendance', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}>
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}
