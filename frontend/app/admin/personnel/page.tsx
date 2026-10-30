'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

type ContractItem = {
  id: string
  contractType: 'CDI' | 'CDD' | 'Stage' | 'Consultant' | 'Prestation'
  startDate: string
  endDate?: string | null
  salary: number
  assignmentLocation?: string | null
  status: 'active' | 'expired' | 'terminated'
  notes?: string | null
}

type StaffMember = {
  id: string
  matricule: string
  firstName: string
  lastName: string
  cin?: string | null
  sex: 'M' | 'F'
  birthDate?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  position: string
  department: string
  hireDate: string
  status: 'active' | 'on_leave' | 'terminated'
  evaluationScore?: number | null
  professionalNotes?: string | null
  activeContract?: ContractItem | null
  contracts?: ContractItem[]
  contractType?: string | null
  salary?: number
  assignmentLocation?: string | null
}

type PersonnelStats = {
  total: number
  active: number
  onLeave: number
  terminated: number
  activeContractsCount: number
  monthlyPayroll: number
  byDepartment: Record<string, number>
  byContractType: Record<string, number>
}

const DEPARTMENTS = [
  'Coordination PDIMA',
  'Vulgarisation Agricole',
  'Administration & Finance',
  'Suivi-Évaluation',
  'Logistique & Terrain',
  'Communication & Partenariats',
]

const CONTRACT_TYPES: ContractItem['contractType'][] = [
  'CDI',
  'CDD',
  'Stage',
  'Consultant',
  'Prestation',
]

const STAFF_STATUS_LABELS: Record<StaffMember['status'], string> = {
  active: 'En poste',
  on_leave: 'En congé / mission',
  terminated: 'Fin de fonction',
}

export default function PersonnelPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<PersonnelStats | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [department, setDepartment] = useState('')
  const [contractType, setContractType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<StaffMember | null>(null)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [showForm, setShowForm] = useState(false)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (debouncedQ) params.set('q', debouncedQ)
    if (department) params.set('department', department)
    if (contractType) params.set('contractType', contractType)
    if (status) params.set('status', status)
    params.set('page', String(page))

    try {
      const r = await fetch(`/api/admin/personnel?${params.toString()}`, {
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })
      if (!r.ok) return
      const data = await r.json().catch(() => ({}))
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotalPages(Math.max(1, Number(data.totalPages) || 1))
      if (data.stats) setStats(data.stats)
    } catch (e) {
      console.error('load personnel failed', e)
    }
  }, [debouncedQ, department, contractType, status, page])

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
    if (!(await confirmDialog('Archiver ce dossier du personnel ?'))) return
    try {
      const r = await fetch(`/api/admin/personnel/${id}`, {
        method: 'DELETE',
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.message || 'Erreur lors de la suppression')
      }
      toast('Dossier personnel archivé ✓', 'success')
      if (selected?.id === id) setSelected(null)
      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        load()
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  function exportCsv() {
    const head = [
      'matricule',
      'lastName',
      'firstName',
      'position',
      'department',
      'contractType',
      'assignmentLocation',
      'salary',
      'phone',
      'status',
    ]
    const rows = items.map((s) =>
      head.map((h) => `"${String((s as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [head.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'personnel-rekoma.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const cdiCount = stats?.byContractType?.CDI || 0
  const cddCount = stats?.byContractType?.CDD || 0

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Personnel & Contrats</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Gestion des ressources humaines, contrats de travail, affectations territoriales et suivi professionnel.
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
            <Plus className="h-4 w-4" /> Nouveau collaborateur
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Effectif total</p>
              <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{stats.total}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {stats.active} en poste · {stats.onLeave} en mission
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Contrats CDI / CDD</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {cdiCount} / {cddCount}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {stats.activeContractsCount} contrat(s) actif(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pôles opérationnels</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {Object.keys(stats.byDepartment || {}).length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Départements couverts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Masse salariale mensuelle</p>
              <p className="mt-1 text-xl font-bold text-foreground tabular-nums sm:text-2xl">
                {(stats.monthlyPayroll || 0).toLocaleString('fr-FR')} Ar
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Contrats actifs cumulés</p>
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
            placeholder="Rechercher par matricule, nom, poste, CIN, téléphone..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">Tous départements</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={contractType}
            onChange={(e) => {
              setContractType(e.target.value)
              setPage(1)
            }}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">Tous contrats</option>
            {CONTRACT_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="col-span-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:col-span-1 sm:w-auto"
          >
            <option value="">Tous statuts RH</option>
            <option value="active">En poste</option>
            <option value="on_leave">En congé / mission</option>
            <option value="terminated">Fin de fonction</option>
          </select>
        </div>
      </div>

      {/* Mobile Native Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun membre du personnel trouvé.
            </CardContent>
          </Card>
        )}
        {items.map((s) => (
          <Card key={s.id} className="overflow-hidden">
            <CardContent className="p-4">
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-primary tabular-nums">{s.matricule}</span>
                    <span aria-hidden="true">·</span>
                    <span>{STAFF_STATUS_LABELS[s.status] || s.status}</span>
                  </div>
                  <h3 className="mt-0.5 truncate text-base font-bold text-foreground">
                    {s.lastName} {s.firstName}
                  </h3>
                  <p className="mt-0.5 truncate text-xs font-medium text-foreground">
                    {s.position} · <span className="text-muted-foreground">{s.department}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {[
                      s.contractType ? `Contrat ${s.contractType}` : null,
                      s.assignmentLocation,
                      s.salary ? `${Number(s.salary).toLocaleString('fr-FR')} Ar` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(s)
                    setShowForm(true)
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Archiver
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
                  <th className="p-4 font-medium">Matricule</th>
                  <th className="p-4 font-medium">Collaborateur</th>
                  <th className="p-4 font-medium">Poste & Département</th>
                  <th className="p-4 font-medium">Contrat & Affectation</th>
                  <th className="p-4 font-medium">Rémunération</th>
                  <th className="p-4 font-medium">Statut RH</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="p-4 font-mono text-xs font-semibold text-primary tabular-nums">
                      {s.matricule}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {s.lastName} {s.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {s.phone || s.email || '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{s.position}</p>
                      <p className="text-xs text-muted-foreground">{s.department}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{s.contractType || '—'}</p>
                      <p className="text-xs text-muted-foreground">{s.assignmentLocation || 'Siège'}</p>
                    </td>
                    <td className="p-4 font-medium tabular-nums">
                      {s.salary ? `${Number(s.salary).toLocaleString('fr-FR')} Ar` : '—'}
                    </td>
                    <td className="p-4 text-xs font-medium text-muted-foreground">
                      {STAFF_STATUS_LABELS[s.status] || s.status}
                      {s.evaluationScore ? ` · ${s.evaluationScore}/5` : ''}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditing(s)
                            setShowForm(true)
                          }}
                          className="rounded-lg p-2 hover:bg-secondary"
                          aria-label={t.admin.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(s.id)}
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
                      Aucun collaborateur enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

      {/* Staff Detail Sheet */}
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
                <p className="text-xs text-muted-foreground tabular-nums">
                  {selected.matricule} · {selected.position} · {STAFF_STATUS_LABELS[selected.status]}
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
                  <p className="text-xs text-muted-foreground">Département / Pôle</p>
                  <p className="font-medium">{selected.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date d’embauche</p>
                  <p className="font-medium tabular-nums">
                    {selected.hireDate ? new Date(selected.hireDate).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CIN</p>
                  <p className="font-mono font-medium tabular-nums">{selected.cin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone · Email</p>
                  <p className="font-medium tabular-nums">
                    {[selected.phone, selected.email].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Évaluation professionnelle</p>
                  <p className="font-medium tabular-nums">
                    {selected.evaluationScore ? `${selected.evaluationScore} / 5` : 'Non évalué'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="font-medium">{selected.address || '—'}</p>
                </div>
                {selected.professionalNotes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Suivi professionnel & objectifs</p>
                    <p className="text-sm text-foreground">{selected.professionalNotes}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Contrat de travail & Affectation</h3>
                {selected.activeContract ? (
                  <div className="mt-2.5 grid grid-cols-1 gap-3 rounded-xl border border-border bg-secondary/25 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Nature du contrat</p>
                      <p className="font-semibold text-primary">{selected.activeContract.contractType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu d’affectation</p>
                      <p className="font-medium">{selected.activeContract.assignmentLocation || 'Siège REKOMA'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Période contractuelle</p>
                      <p className="font-medium tabular-nums">
                        Du {new Date(selected.activeContract.startDate).toLocaleDateString('fr-FR')}
                        {selected.activeContract.endDate
                          ? ` au ${new Date(selected.activeContract.endDate).toLocaleDateString('fr-FR')}`
                          : ' (Durée indéterminée)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Salaire mensuel brut</p>
                      <p className="font-semibold tabular-nums">
                        {Number(selected.activeContract.salary || 0).toLocaleString('fr-FR')} Ar
                      </p>
                    </div>
                    {selected.activeContract.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Clauses / observations contrat</p>
                        <p className="text-xs text-foreground">{selected.activeContract.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Aucun contrat rattaché.</p>
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
                <Pencil className="mr-1.5 h-4 w-4" /> Modifier dossier & contrat
              </button>
              <button
                onClick={() => remove(selected.id)}
                className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }), 'min-h-[46px] flex-1')}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Archiver
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <StaffFormModal
          staff={editing}
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

function StaffFormModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: StaffMember | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const toast = useToast()
  const activeCtr = staff?.activeContract || staff?.contracts?.[0] || null

  const [form, setForm] = useState({
    matricule: staff?.matricule || '',
    lastName: staff?.lastName || '',
    firstName: staff?.firstName || '',
    cin: staff?.cin || '',
    sex: staff?.sex || 'M',
    birthDate: staff?.birthDate ? new Date(staff.birthDate).toISOString().slice(0, 10) : '',
    phone: staff?.phone || '',
    email: staff?.email || '',
    address: staff?.address || '',
    position: staff?.position || '',
    department: staff?.department || 'Coordination PDIMA',
    hireDate: staff?.hireDate
      ? new Date(staff.hireDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    status: staff?.status || 'active',
    evaluationScore: staff?.evaluationScore ? String(staff.evaluationScore) : '',
    professionalNotes: staff?.professionalNotes || '',
    contractType: (activeCtr?.contractType || 'CDD') as ContractItem['contractType'],
    assignmentLocation: activeCtr?.assignmentLocation || 'Antenne Vakinankaratra',
    contractStartDate: activeCtr?.startDate
      ? new Date(activeCtr.startDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    contractEndDate: activeCtr?.endDate ? new Date(activeCtr.endDate).toISOString().slice(0, 10) : '',
    salary: activeCtr?.salary ? String(activeCtr.salary) : '',
    contractNotes: activeCtr?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit() {
    if (!form.lastName.trim() || !form.firstName.trim() || !form.position.trim()) {
      toast('Le nom, le prénom et l’intitulé du poste sont requis.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      matricule: form.matricule.trim() || undefined,
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      cin: form.cin.trim() || null,
      sex: form.sex,
      birthDate: form.birthDate || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      position: form.position.trim(),
      department: form.department,
      hireDate: form.hireDate,
      status: form.status,
      evaluationScore: form.evaluationScore !== '' ? Number(form.evaluationScore) : null,
      professionalNotes: form.professionalNotes.trim() || null,
      contract: {
        id: activeCtr?.id,
        contractType: form.contractType,
        assignmentLocation: form.assignmentLocation.trim() || null,
        startDate: form.contractStartDate || form.hireDate,
        endDate: form.contractType === 'CDI' ? null : form.contractEndDate || null,
        salary: Number(form.salary) || 0,
        status: form.status === 'terminated' ? 'terminated' : 'active',
        notes: form.contractNotes.trim() || null,
      },
    }

    try {
      const url = staff ? `/api/admin/personnel/${staff.id}` : '/api/admin/personnel'
      const method = staff ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || d.error || 'Échec de l’enregistrement')
      toast('Dossier personnel et contrat enregistrés ✓', 'success')
      onSaved()
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
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
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl pb-safe sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="font-semibold">
              {staff ? 'Modifier le dossier collaborateur' : 'Nouveau collaborateur REKOMA'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Module RH indépendant des bénéficiaires communautaires.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-primary">
              01. Identité & Affectation professionnelle
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Matricule RH</Label>
                <Input
                  value={form.matricule}
                  onChange={(e) => set('matricule', e.target.value)}
                  placeholder="Auto (ex: REK-RH-003)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Poste / Fonction *</Label>
                <Input
                  value={form.position}
                  onChange={(e) => set('position', e.target.value)}
                  placeholder="Ex : Technicien Agricole"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Département / Pôle</Label>
                <select
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut RH</Label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="active">En poste</option>
                  <option value="on_leave">En congé / mission</option>
                  <option value="terminated">Fin de fonction</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>CIN</Label>
                <Input value={form.cin} onChange={(e) => set('cin', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+261..." />
              </div>
              <div className="space-y-1.5">
                <Label>Email professionnel</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-primary">
              02. Contrat de travail & Suivi
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Type de contrat</Label>
                <select
                  value={form.contractType}
                  onChange={(e) => set('contractType', e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {CONTRACT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Lieu d’affectation</Label>
                <Input
                  value={form.assignmentLocation}
                  onChange={(e) => set('assignmentLocation', e.target.value)}
                  placeholder="Ex : Antenne Vakinankaratra"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Salaire mensuel (Ar)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.salary}
                  onChange={(e) => set('salary', e.target.value)}
                  placeholder="Ex : 1200000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Début du contrat</Label>
                <Input
                  type="date"
                  value={form.contractStartDate}
                  onChange={(e) => set('contractStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Échéance (si CDD/Stage)</Label>
                <Input
                  type="date"
                  disabled={form.contractType === 'CDI'}
                  value={form.contractEndDate}
                  onChange={(e) => set('contractEndDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note de suivi (/5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={form.evaluationScore}
                  onChange={(e) => set('evaluationScore', e.target.value)}
                  placeholder="Ex : 4.6"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Suivi professionnel, responsabilités & clauses</Label>
              <Textarea
                value={form.professionalNotes}
                onChange={(e) => set('professionalNotes', e.target.value)}
                placeholder="Objectifs annuels, zones d’intervention, observations RH..."
              />
            </div>
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
