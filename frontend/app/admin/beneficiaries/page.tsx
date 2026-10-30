'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Download, ChevronRight } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function getBrowserAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
  const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : null
  return {
    ...extra,
    ...(valid ? { authorization: `Bearer ${valid}` } : {}),
  }
}

type FollowedFormation = {
  id: string
  title: string
  session?: string | null
  status?: string | null
  attendanceStatus?: string | null
  evaluationScore?: number | null
  certificateIssued?: boolean
}

type Beneficiary = {
  id: string
  firstName: string
  lastName: string
  cin?: string | null
  birthDate?: string | null
  sex?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  commune?: string | null
  fokontany?: string | null
  householdSize?: number | null
  name: string
  category: string
  contact?: string | null
  status?: string | null
  notes?: string | null
  formationsCount?: number
  formations?: FollowedFormation[]
  createdAt?: string | null
}

type BeneficiaryStats = {
  total: number
  active: number
  communesCount: number
  householdsTotal: number
  enrolledInFormations: number
  breakdown: Record<string, number>
}

const CATEGORIES = [
  'Agriculture & SRI',
  'Maraîchage',
  'Élevage avicole',
  'Eau & WASH',
  'Distribution communautaire',
  'Autre',
]

const ATTENDANCE_LABELS: Record<string, string> = {
  enrolled: 'Inscrit',
  present: 'Présent',
  absent: 'Absent',
  completed: 'Certifié / Complété',
}

export default function BeneficiariesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Beneficiary[]>([])
  const [stats, setStats] = useState<BeneficiaryStats | null>(null)
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
    const params = new URLSearchParams()
    if (debouncedQ) params.set('q', debouncedQ)
    if (category) params.set('category', category)
    if (formationId) params.set('formationId', formationId)
    if (status) params.set('status', status)
    if (sex) params.set('sex', sex)
    if (commune) params.set('commune', commune)
    params.set('page', String(page))

    const headers = getBrowserAuthHeaders()

    const [listRes, statsRes, fmRes] = await Promise.all([
      fetch(`/api/admin/beneficiaries?${params.toString()}`, {
        headers,
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => null),
      fetch('/api/admin/beneficiaries/stats', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => null),
      fetch('/api/admin/formations?all=1', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => null),
    ])

    if (listRes?.ok) {
      const data = await listRes.json().catch(() => ({}))
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotalPages(Math.max(1, Number(data.totalPages) || 1))
    }
    if (statsRes?.ok) {
      const st = await statsRes.json().catch(() => null)
      if (st) setStats(st)
    }
    if (fmRes?.ok) {
      const fm = await fmRes.json().catch(() => ({}))
      setFormations(Array.isArray(fm.items) ? fm.items : [])
    }
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

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    try {
      const r = await fetch(`/api/admin/beneficiaries/${id}`, {
        method: 'DELETE',
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.message || 'Erreur lors de la suppression')
      }
      toast('Bénéficiaire supprimé ✓', 'success')
      if (selected?.id === id) setSelected(null)
      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        load()
      }
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la suppression', 'error')
    }
  }

  function exportCsv() {
    const head = [
      'lastName',
      'firstName',
      'cin',
      'sex',
      'phone',
      'commune',
      'fokontany',
      'householdSize',
      'category',
      'formationsCount',
      'status',
    ]
    const rows = items.map((m) =>
      head.map((h) => `"${String((m as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [head.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beneficiaires-rekoma.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.beneficiaries || 'Bénéficiaires'}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Profils communautaires, rattachement géographique et filières agricoles (inscriptions gérées dans Formations).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-[44px] flex-1 sm:min-h-[38px] sm:flex-none'
            )}
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
            <Plus className="h-4 w-4" /> Nouveau bénéficiaire
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total bénéficiaires</p>
              <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{stats.total}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{stats.active} actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Communes couvertes</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{stats.communesCount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Rattachement territorial</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Inscrits en formation</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {stats.enrolledInFormations}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Via table d’inscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Membres de ménages</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {stats.householdsTotal || stats.total}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Impact familial estimé</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher nom, prénom, CIN, téléphone, commune, fokontany..."
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
            <option value="">Toutes filières</option>
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
            <option value="">Toutes formations suivies</option>
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
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
          <select
            value={sex}
            onChange={(e) => {
              setSex(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">Tous sexes</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
      </div>

      {/* Mobile Native Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun bénéficiaire enregistré pour ces critères.
            </CardContent>
          </Card>
        )}
        {items.map((b) => (
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
                  <p className="mt-1.5 truncate text-xs text-muted-foreground">
                    {[b.commune, b.fokontany ? `Fkt ${b.fokontany}` : null, b.phone || b.contact]
                      .filter(Boolean)
                      .join(' · ') || 'Localisation non renseignée'}
                  </p>
                  <p className="mt-1 text-xs text-foreground tabular-nums">
                    Formations suivies :{' '}
                    <span className="font-semibold text-primary">{b.formations?.length || 0}</span>
                  </p>
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
                  <th className="p-4 font-medium">Bénéficiaire</th>
                  <th className="p-4 font-medium">CIN</th>
                  <th className="p-4 font-medium">Filière / Rattachement</th>
                  <th className="p-4 font-medium">Commune · Fokontany</th>
                  <th className="p-4 font-medium">Téléphone</th>
                  <th className="p-4 font-medium">Formations</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr
                    key={b.id}
                    className={cn(
                      'cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40',
                      selected?.id === b.id && 'bg-secondary/60'
                    )}
                    onClick={() => setSelected(b)}
                  >
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {b.lastName} {b.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.sex === 'F' ? 'Féminin' : 'Masculin'} · {b.status === 'inactive' ? 'Inactif' : 'Actif'}
                      </p>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground tabular-nums">{b.cin || '—'}</td>
                    <td className="p-4 text-xs font-semibold text-primary">{b.category}</td>
                    <td className="p-4 text-muted-foreground">
                      {[b.commune, b.fokontany].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="p-4 text-muted-foreground tabular-nums">{b.phone || b.contact || '—'}</td>
                    <td className="p-4 text-xs text-foreground tabular-nums">
                      {b.formations && b.formations.length > 0
                        ? `${b.formations.length} inscrite(s)`
                        : 'Aucune'}
                    </td>
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
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucun bénéficiaire enregistré.
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
              <div>
                <h2 className="text-base font-semibold sm:text-lg">
                  {selected.lastName} {selected.firstName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selected.category} · {selected.status === 'inactive' ? 'Inactif' : 'Actif'}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">CIN</p>
                  <p className="font-mono font-medium tabular-nums">{selected.cin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de naissance · Sexe</p>
                  <p className="font-medium tabular-nums">
                    {selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('fr-FR') : '—'} ·{' '}
                    {selected.sex === 'F' ? 'Féminin' : 'Masculin'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium tabular-nums">{selected.phone || selected.contact || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commune</p>
                  <p className="font-medium">{selected.commune || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fokontany · Taille du ménage</p>
                  <p className="font-medium tabular-nums">
                    {selected.fokontany || '—'}
                    {selected.householdSize ? ` · ${selected.householdSize} pers.` : ''}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Adresse / Exploitation</p>
                  <p className="font-medium">{selected.address || '—'}</p>
                </div>
                {selected.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Observations agricoles / communautaires</p>
                    <p className="text-sm text-foreground">{selected.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Formations suivies ({selected.formations?.length || 0})
                </h3>
                {!selected.formations || selected.formations.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Aucune inscription enregistrée. Pour inscrire ce bénéficiaire à une session, ouvrez le module Formations.
                  </p>
                ) : (
                  <div className="mt-2.5 divide-y divide-border rounded-xl border border-border">
                    {selected.formations.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              f.session,
                              ATTENDANCE_LABELS[f.attendanceStatus || 'enrolled'] || f.attendanceStatus,
                              f.evaluationScore ? `Note ${f.evaluationScore}/5` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        {f.certificateIssued && (
                          <span className="shrink-0 text-xs font-semibold text-primary">Attesté</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
  onClose,
  onSaved,
}: {
  beneficiary: Beneficiary | null
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
    phone: beneficiary?.phone || beneficiary?.contact || '',
    email: beneficiary?.email || '',
    commune: beneficiary?.commune || '',
    fokontany: beneficiary?.fokontany || '',
    address: beneficiary?.address || '',
    householdSize: beneficiary?.householdSize ? String(beneficiary.householdSize) : '',
    category:
      beneficiary?.category && CATEGORIES.includes(beneficiary.category)
        ? beneficiary.category
        : 'Agriculture & SRI',
    status: beneficiary?.status || 'active',
    notes: beneficiary?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit() {
    if (!form.lastName.trim() || !form.firstName.trim()) {
      setError('Le nom et le prénom du bénéficiaire sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        name: `${form.lastName.trim()} ${form.firstName.trim()}`,
        contact: form.phone.trim() || null,
        householdSize: form.householdSize ? Number(form.householdSize) : null,
      }
      const url = beneficiary ? `/api/admin/beneficiaries/${beneficiary.id}` : '/api/admin/beneficiaries'
      const method = beneficiary ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        throw new Error(data.message || data.error || 'Erreur lors de la sauvegarde')
      }
      toast('Profil bénéficiaire enregistré ✓', 'success')
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
          <h2 className="font-semibold">
            {beneficiary ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
          </h2>
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
              <Label>Numéro CIN</Label>
              <Input value={form.cin} onChange={(e) => set('cin', e.target.value)} placeholder="Ex : 108 011..." />
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
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+261 34..." />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Commune rurale / urbaine</Label>
              <Input value={form.commune} onChange={(e) => set('commune', e.target.value)} placeholder="Ex : Ambatolampy" />
            </div>
            <div className="space-y-1.5">
              <Label>Fokontany</Label>
              <Input value={form.fokontany} onChange={(e) => set('fokontany', e.target.value)} placeholder="Ex : Manandona" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Adresse / Localité d’exploitation</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Filière agricole / communautaire</Label>
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
              <Label>Taille du ménage</Label>
              <Input
                type="number"
                min={1}
                value={form.householdSize}
                onChange={(e) => set('householdSize', e.target.value)}
                placeholder="Ex : 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email (optionnel)</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut du bénéficiaire</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes d’accompagnement agricole</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Superficie cultivée, groupement paysan, besoins spécifiques..."
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[46px] w-full sm:w-auto')}
          >
            {t.admin.cancel}
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className={cn(buttonVariants({}), 'min-h-[46px] w-full sm:w-auto')}
          >
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}
