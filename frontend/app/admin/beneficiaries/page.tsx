'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Download, ChevronRight } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  { value: '', label: 'Tous sexes' },
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'Tous statuts' },
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
    const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
    const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : undefined
    const authHeader = valid ? `Bearer ${valid}` : undefined
    const [data, st, fm] = await Promise.all([
      remoteBeneficiaries
        .list(
          debouncedQ || undefined,
          category || undefined,
          formationId || undefined,
          status || undefined,
          sex || undefined,
          commune || undefined,
          String(page),
          authHeader
        )
        .catch((e) => {
          console.error('remoteBeneficiaries.list failed', e)
          return { items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any
        }),
      remoteBeneficiaries.stats(authHeader).catch((e) => {
        console.error('remoteBeneficiaries.stats failed', e)
        return { total: 0, breakdown: {} }
      }),
      remoteFormations.list(undefined, undefined, undefined, undefined, undefined, authHeader).catch((e) => {
        console.error('remoteFormations.list failed', e)
        return []
      }),
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

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => items, [items])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
      const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : undefined
      await remoteBeneficiaries.remove(id, valid ? `Bearer ${valid}` : undefined)
      toast('Supprimé ✓', 'success')
      load()
      if (selected?.id === id) setSelected(null)
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la suppression', 'error')
    }
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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.beneficiaries || 'Bénéficiaires'}</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[44px] flex-1 sm:min-h-[38px] sm:flex-none')}
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] flex-1 sm:min-h-[38px] sm:flex-none')}
          >
            <Plus className="h-4 w-4" /> Nouveau
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="p-3.5 text-center sm:p-4">
              <p className="text-xl font-bold text-primary tabular-nums sm:text-2xl">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          {CATEGORIES.map((c) => (
            <Card key={c}>
              <CardContent className="p-3.5 text-center sm:p-4">
                <p className="text-xl font-bold text-primary tabular-nums sm:text-2xl">{stats.breakdown?.[c] || 0}</p>
                <p className="text-xs text-muted-foreground">{c}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher nom, prénom, CIN, téléphone, adresse..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={formationId}
            onChange={(e) => {
              setFormationId(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">Toutes formations</option>
            {formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={sex}
            onChange={(e) => {
              setSex(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            {SEX_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={commune}
            onChange={(e) => {
              setCommune(e.target.value)
              setPage(1)
            }}
            className="col-span-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:col-span-1 sm:w-auto"
          >
            <option value="">Toutes communes</option>
            {Array.from(new Set(items.map((i) => i.commune).filter(Boolean))).map((c) => (
              <option key={String(c)} value={String(c)}>
                {String(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Native Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun bénéficiaire.
            </CardContent>
          </Card>
        )}
        {filtered.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <CardContent className="p-4">
              <button
                type="button"
                onClick={() => setSelected(b)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {b.lastName} {b.firstName}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{b.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{b.status === 'inactive' ? 'Inactif' : 'Actif'}</span>
                    {b.cin && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">CIN {b.cin}</span>
                      </>
                    )}
                  </div>
                  {b.formation?.title && (
                    <p className="mt-1.5 truncate text-xs text-foreground">
                      Formation : <span className="text-muted-foreground">{b.formation.title}</span>
                    </p>
                  )}
                  {(b.contact || b.phone || b.commune) && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[b.contact || b.phone, b.commune].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(b)
                    setShowForm(true)
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Data Table View (>= md) */}
      <Card className="hidden md:block">
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
                  <tr
                    key={b.id}
                    className={cn(
                      'cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40',
                      selected?.id === b.id && 'bg-secondary/60'
                    )}
                    onClick={() => setSelected(b)}
                  >
                    <td className="p-4 font-medium">{b.lastName}</td>
                    <td className="p-4 font-medium">{b.firstName}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground tabular-nums">{b.cin || '—'}</td>
                    <td className="p-4 text-xs font-semibold text-primary">{b.category}</td>
                    <td className="p-4 text-muted-foreground">{b.formation?.title || '—'}</td>
                    <td className="p-4 text-muted-foreground tabular-nums">{b.contact || '—'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditing(b)
                            setShowForm(true)
                          }}
                          className="rounded-lg p-2 hover:bg-secondary"
                          aria-label={t.admin.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(b.id)}
                          className="rounded-lg p-2 text-destructive hover:bg-secondary"
                          aria-label={t.admin.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucun bénéficiaire.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl pb-safe sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-base font-semibold sm:text-lg">Détails du bénéficiaire</h2>
              <button
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <p className="font-mono font-medium tabular-nums">{selected.cin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de naissance</p>
                  <p className="font-medium tabular-nums">
                    {selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sexe</p>
                  <p className="font-medium">{selected.sex === 'F' ? 'Féminin' : 'Masculin'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium tabular-nums">{selected.phone || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="font-medium">{selected.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commune</p>
                  <p className="font-medium">{selected.commune || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="font-semibold text-primary">{selected.category}</p>
                </div>
                {selected.formation && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Formation</p>
                    <p className="font-medium">{selected.formation.title}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium tabular-nums">{selected.contact || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="font-medium">{selected.status === 'inactive' ? 'Inactif' : 'Actif'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Présence</p>
                  <p className="font-medium">{selected.attendance || '—'}</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => {
                  const target = selected
                  setSelected(null)
                  setEditing(target)
                  setShowForm(true)
                }}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[46px] flex-1')}
              >
                <Pencil className="mr-1.5 h-4 w-4" /> Modifier
              </button>
              <button
                onClick={() => remove(selected.id)}
                className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }), 'min-h-[46px] flex-1')}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
        >
          Précédent
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
        >
          Suivant
        </button>
      </div>

      {showForm && (
        <BeneficiaryForm
          beneficiary={editing}
          formations={formations}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={() => {
            setShowForm(false)
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function BeneficiaryForm({
  beneficiary,
  formations,
  onClose,
  onSaved,
}: {
  beneficiary: Beneficiary | null
  formations: { id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    firstName: beneficiary?.firstName || '',
    lastName: beneficiary?.lastName || '',
    cin: beneficiary?.cin || '',
    birthDate: beneficiary?.birthDate
      ? (() => {
          const d = new Date(beneficiary.birthDate)
          return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
        })()
      : '',
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

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

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
          <h2 className="font-semibold">{beneficiary ? 'Modifier' : 'Nouveau bénéficiaire'}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>CIN</Label>
              <Input value={form.cin} onChange={(e) => set('cin', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de naissance</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <select
                value={form.sex}
                onChange={(e) => set('sex', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Formation (optionnel)</Label>
              <select
                value={form.formationId}
                onChange={(e) => set('formationId', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">—</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="+261..." />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
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
