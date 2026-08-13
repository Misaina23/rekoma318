'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Users, Eye } from 'lucide-react'
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
  name: string
  category: string
  formationId?: string | null
  formation?: { id: string; title: string } | null
  contact?: string | null
  createdAt?: string | null
}

const CATEGORIES = ['Distribution', 'Emploi', 'Formation', 'Autre']

export default function BeneficiariesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Beneficiary[]>([])
  const [stats, setStats] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formations, setFormations] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<Beneficiary | null>(null)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const [data, st, fm] = await Promise.all([
      remoteBeneficiaries.list(debouncedQ || undefined, category || undefined).catch(() => []),
      remoteBeneficiaries.stats().catch(() => ({ total: 0, breakdown: {} })),
      remoteFormations.list().catch(() => []),
    ])
    setItems(data as Beneficiary[])
    setStats(st as any)
    setFormations(fm as any)
  }, [debouncedQ, category])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedQ(q)
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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." className="pl-9" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> Nouveau
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={cn('lg:col-span-2', selected && 'hidden lg:block')}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium">Catégorie</th>
                    <th className="p-4 font-medium">Formation</th>
                    <th className="p-4 font-medium">Contact</th>
                    <th className="p-4 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className={cn('border-b border-border last:border-0 cursor-pointer hover:bg-secondary/40', selected?.id === b.id && 'bg-secondary/60')} onClick={() => setSelected(b)}>
                      <td className="p-4 font-medium">{b.name}</td>
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
                  {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun bénéficiaire.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(!selected && 'lg:col-span-3')}>
          <CardContent className="p-6">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Détails</h2>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nom</p>
                    <p className="font-medium">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Catégorie</p>
                    <Badge variant="outline">{selected.category}</Badge>
                  </div>
                  {selected.formation && (
                    <div>
                      <p className="text-xs text-muted-foreground">Formation</p>
                      <p className="font-medium">{selected.formation.title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium">{selected.contact || '—'}</p>
                  </div>
                  {selected.createdAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Date d&apos;ajout</p>
                      <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setEditing(selected); setShowForm(true) }} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}><Pencil className="mr-2 h-4 w-4" /> Modifier</button>
                  <button onClick={() => remove(selected.id)} className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Eye className="mb-2 h-8 w-8" />
                <p>Sélectionnez un bénéficiaire pour voir les détails</p>
              </div>
            )}
          </CardContent>
        </Card>
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
  const [form, setForm] = useState({ name: beneficiary?.name || '', category: beneficiary?.category || 'Autre', formationId: beneficiary?.formationId || '', contact: beneficiary?.contact || '' })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
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
      toast(e.message || 'Erreur', 'error')
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
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
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
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="+261..." />
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
