'use client'

import { useEffect, useState, useMemo, useRef, useCallback, type ReactNode } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Users, FileText, UserPlus, UserMinus } from 'lucide-react'
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

type EnrolledBeneficiary = {
  id: string
  enrollmentId?: string
  firstName: string
  lastName: string
  cin?: string | null
  phone?: string | null
  commune?: string | null
  category?: string | null
  address?: string | null
  status?: string | null
  attendanceStatus?: 'enrolled' | 'present' | 'absent' | 'completed'
  evaluationScore?: number | null
  certificateIssued?: boolean
  enrolledAt?: string
}

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
  capacity?: number
  participants: number
  attendees: number
  enrolledCount?: number
  presentCount?: number
  participationRate?: number
  evaluation: number
  certificate: boolean
  status: 'planned' | 'ongoing' | 'done'
  beneficiaries?: EnrolledBeneficiary[]
}

const STATUS: Formation['status'][] = ['planned', 'ongoing', 'done']
const STATUS_LABELS: Record<Formation['status'], string> = {
  planned: 'Planifiée',
  ongoing: 'En cours',
  done: 'Terminée',
}

const ATTENDANCE_OPTIONS: { value: NonNullable<EnrolledBeneficiary['attendanceStatus']>; label: string }[] = [
  { value: 'enrolled', label: 'Inscrit' },
  { value: 'present', label: 'Présent' },
  { value: 'completed', label: 'Certifié / Complété' },
  { value: 'absent', label: 'Absent' },
]

export default function FormationsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Formation[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Formation | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (status) params.set('status', status)
      params.set('page', String(page))
      const r = await fetch(`/api/admin/formations?${params.toString()}`, {
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return
      const nextItems = Array.isArray(data.items) ? data.items : []
      const nextTotalPages = Math.max(1, Number(data.totalPages) || 1)
      if (nextItems.length === 0 && page > nextTotalPages) {
        setPage(nextTotalPages)
        return
      }
      setItems(nextItems)
      setTotalPages(nextTotalPages)
    } catch (e) {
      console.error('load formations failed', e)
    }
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

  useEffect(() => {
    load()
  }, [load])

  const selectedFormation = useMemo(
    () => items.find((f) => f.id === selectedId) || null,
    [items, selectedId]
  )

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    try {
      const r = await fetch(`/api/admin/formations/${id}`, {
        method: 'DELETE',
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
      })
      if (r.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        toast('Formation supprimée (bénéficiaires préservés) ✓', 'success')
        if (items.length === 1 && page > 1) {
          setPage((p) => Math.max(1, p - 1))
        } else {
          await load()
        }
      } else {
        const d = await r.json().catch(() => ({}))
        toast(d.message || d.error || 'Échec de la suppression de la formation', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la suppression', 'error')
    }
  }

  async function generateCertificates(formation: Formation) {
    const count = formation.beneficiaries?.length || 0
    if (count === 0) {
      toast('Aucun bénéficiaire inscrit dans cette formation.', 'error')
      return
    }
    const confirmed = await confirmDialog(
      `Cette formation compte ${count} bénéficiaire(s) inscrit(s). Générer le fichier PDF des attestations ?`
    )
    if (!confirmed) return

    try {
      const r = await fetch(`/api/admin/formations/${formation.id}/certificates`, {
        method: 'POST',
        headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({}),
      })
      if (r.ok && r.headers.get('content-type')?.includes('application/pdf')) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attestations-${formation.id}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        toast('Attestations générées ✓', 'success')
      } else {
        const d = await r.json().catch(() => ({}))
        toast(d?.error || d?.message || 'Erreur lors de la génération', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.formations}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Sessions de formation indépendantes et gestion relationnelle des inscriptions bénéficiaires.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] w-full sm:min-h-[38px] sm:w-auto')}
        >
          <Plus className="h-4 w-4" /> Nouvelle formation
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre, session, lieu ou formateur..."
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
        {items.map((f) => {
          const enrolled = f.beneficiaries?.length ?? f.participants ?? 0
          const present = f.presentCount ?? f.attendees ?? 0
          const rate =
            enrolled > 0
              ? Math.min(100, Math.round((present / enrolled) * 100))
              : f.participationRate || 0
          return (
            <Card key={f.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground">{f.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums sm:text-sm">
                      {[f.session, new Date(f.date).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')}
                    </p>
                    {(f.location || f.trainer) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          f.location ? `Lieu : ${f.location}` : null,
                          f.trainer ? `Formateur : ${f.trainer}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {STATUS_LABELS[f.status] || f.status}
                  </span>
                </div>

                {f.description && (
                  <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
                  <span>
                    Inscrits :{' '}
                    <strong className="text-foreground">
                      {enrolled}/{f.capacity || 30}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Présents : <strong className="text-foreground">{present}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Participation : <strong className="text-primary">{rate}%</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Note : <strong className="text-foreground">{f.evaluation}/5</strong>
                  </span>
                  {f.certificate && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-primary">Attestation incluse</span>
                    </>
                  )}
                </div>

                {(f.startDate || f.endDate) && (
                  <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                    Du {f.startDate ? new Date(f.startDate).toLocaleDateString('fr-FR') : '...'} au{' '}
                    {f.endDate ? new Date(f.endDate).toLocaleDateString('fr-FR') : '...'}
                  </p>
                )}

                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    <Users className="h-3.5 w-3.5" /> Inscriptions ({enrolled})
                  </button>
                  <button
                    type="button"
                    onClick={() => generateCertificates(f)}
                    className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(f)
                      setShowForm(true)
                    }}
                    className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {items.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Aucune formation enregistrée.
            </CardContent>
          </Card>
        )}
      </div>

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
        <FormationForm
          formation={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      {selectedFormation && (
        <FormationEnrollmentsModal
          formation={selectedFormation}
          onClose={() => setSelectedId(null)}
          onUpdated={() => load()}
        />
      )}
    </div>
  )
}

function FormationForm({
  formation,
  onClose,
  onSaved,
}: {
  formation: Formation | null
  onClose: () => void
  onSaved: () => void
}) {
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
    date: formation?.date
      ? new Date(formation.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    capacity: formation?.capacity || 30,
    evaluation: formation?.evaluation || 0,
    certificate: formation?.certificate || false,
    status: formation?.status || 'planned',
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit() {
    if (!form.title.trim()) {
      toast('Le titre de la formation est requis.', 'error')
      return
    }
    setSaving(true)
    const method = formation ? 'PATCH' : 'POST'
    const url = formation ? `/api/admin/formations/${formation.id}` : '/api/admin/formations'
    const r = await fetch(url, {
      method,
      headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify(form),
      credentials: 'include',
    })
    const d = await r.json().catch(() => ({}))
    setSaving(false)
    if (r.ok) {
      toast('Formation enregistrée ✓', 'success')
      onSaved()
    } else {
      toast(d.message || d.error || t.admin.save, 'error')
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
          <div>
            <h2 className="font-semibold">
              {formation ? 'Modifier la formation' : 'Créer une formation'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Entité indépendante — les inscriptions se gèrent via le bouton Inscriptions.
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
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Titre de la formation *">
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex : Techniques rizicoles SRI & compostage"
            />
          </Field>
          <Field label="Description & objectifs pédagogiques">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Session / Promotion">
              <Input
                value={form.session}
                onChange={(e) => set('session', e.target.value)}
                placeholder="Ex : Session T3 2026"
              />
            </Field>
            <Field label="Capacité d’accueil">
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set('capacity', Math.max(1, Number(e.target.value) || 1))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date début">
              <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Date fin">
              <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Lieu de formation">
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
            <Field label="Formateur / Intervenant">
              <Input value={form.trainer} onChange={(e) => set('trainer', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Date de référence">
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Statut">
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
            <Field label="Évaluation (/5)">
              <Input
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={form.evaluation}
                onChange={(e) => set('evaluation', Number(e.target.value))}
              />
            </Field>
          </div>
          <label className="flex min-h-[40px] items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.certificate}
              onChange={(e) => set('certificate', e.target.checked)}
              className="h-4 w-4"
            />
            Délivre une attestation officielle de participation
          </label>
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

function FormationEnrollmentsModal({
  formation,
  onClose,
  onUpdated,
}: {
  formation: Formation
  onClose: () => void
  onUpdated: () => void
}) {
  const toast = useToast()
  const [enrolled, setEnrolled] = useState<EnrolledBeneficiary[]>(formation.beneficiaries || [])
  const [allBeneficiaries, setAllBeneficiaries] = useState<EnrolledBeneficiary[]>([])
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('')
  const [initialStatus, setInitialStatus] = useState<'enrolled' | 'present'>('enrolled')
  const [submitting, setSubmitting] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    setEnrolled(formation.beneficiaries || [])
  }, [formation])

  useEffect(() => {
    fetch('/api/admin/beneficiaries?all=1', {
      headers: getBrowserAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.items)) setAllBeneficiaries(d.items)
      })
      .catch(() => {})
  }, [])

  const enrolledIds = useMemo(() => new Set(enrolled.map((e) => e.id)), [enrolled])

  const availableBeneficiaries = useMemo(
    () => allBeneficiaries.filter((b) => !enrolledIds.has(b.id) && b.status !== 'inactive'),
    [allBeneficiaries, enrolledIds]
  )

  const filteredEnrolled = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return enrolled
    return enrolled.filter((b) =>
      `${b.lastName} ${b.firstName} ${b.cin ?? ''} ${b.commune ?? ''} ${b.phone ?? ''}`
        .toLowerCase()
        .includes(term)
    )
  }, [enrolled, q])

  const presentCount = enrolled.filter(
    (e) => e.attendanceStatus === 'present' || e.attendanceStatus === 'completed'
  ).length
  const participationRate =
    enrolled.length > 0 ? Math.min(100, Math.round((presentCount / enrolled.length) * 100)) : 0

  async function enrollBeneficiary() {
    if (!selectedBeneficiaryId) {
      toast('Choisissez un bénéficiaire à inscrire.', 'error')
      return
    }
    const candidate = allBeneficiaries.find((b) => b.id === selectedBeneficiaryId)
    setSubmitting(true)
    try {
      const r = await fetch(`/api/admin/formations/${formation.id}/enrollments`, {
        method: 'POST',
        headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          beneficiaryId: selectedBeneficiaryId,
          attendanceStatus: initialStatus,
          beneficiary: candidate,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || d.error || 'Échec de l’inscription')

      if (candidate) {
        setEnrolled((prev) => [
          {
            ...candidate,
            attendanceStatus: initialStatus,
            enrolledAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
      setSelectedBeneficiaryId('')
      toast('Bénéficiaire inscrit à la formation ✓', 'success')
      onUpdated()
    } catch (e: any) {
      toast(e.message || 'Erreur lors de l’inscription', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function changeAttendance(
    b: EnrolledBeneficiary,
    attendanceStatus: NonNullable<EnrolledBeneficiary['attendanceStatus']>
  ) {
    setEnrolled((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, attendanceStatus } : item))
    )
    const r = await fetch(`/api/admin/formations/${formation.id}/enrollments`, {
      method: 'PATCH',
      headers: getBrowserAuthHeaders({ 'content-type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({
        beneficiaryId: b.id,
        attendanceStatus,
        beneficiary: b,
      }),
    })
    if (r.ok) {
      toast('Présence mise à jour ✓', 'success')
      onUpdated()
    } else {
      toast('Erreur lors de la mise à jour', 'error')
    }
  }

  async function unenroll(b: EnrolledBeneficiary) {
    const ok = await confirmDialog(
      `Retirer ${b.lastName} ${b.firstName} de cette formation ? Son profil bénéficiaire sera conservé.`
    )
    if (!ok) return
    const r = await fetch(
      `/api/admin/formations/${formation.id}/enrollments?beneficiaryId=${encodeURIComponent(b.id)}`,
      {
        method: 'DELETE',
        headers: getBrowserAuthHeaders(),
        credentials: 'include',
      }
    )
    if (r.ok) {
      setEnrolled((prev) => prev.filter((x) => x.id !== b.id))
      toast('Bénéficiaire désinscrit de la session ✓', 'success')
      onUpdated()
    } else {
      const d = await r.json().catch(() => ({}))
      toast(d.message || 'Erreur lors de la désinscription', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl pb-safe sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0 pr-3">
            <h2 className="truncate font-semibold">Inscriptions — {formation.title}</h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {enrolled.length} inscrit(s) · {presentCount} présent(s) · Taux de participation :{' '}
              <strong className="text-primary">{participationRate}%</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Pivot Enrollment Form */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 sm:p-4">
            <p className="mb-2.5 text-xs font-semibold text-foreground">
              Inscrire un bénéficiaire existant (table relationnelle formation_beneficiaire)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedBeneficiaryId}
                onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">
                  {availableBeneficiaries.length > 0
                    ? `Sélectionner un bénéficiaire (${availableBeneficiaries.length} disponible(s))...`
                    : 'Tous les bénéficiaires actifs sont déjà inscrits'}
                </option>
                {availableBeneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.lastName} {b.firstName}
                    {b.commune ? ` — ${b.commune}` : ''}
                    {b.cin ? ` (CIN ${b.cin})` : ''}
                  </option>
                ))}
              </select>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as 'enrolled' | 'present')}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm sm:w-40"
              >
                <option value="enrolled">Statut : Inscrit</option>
                <option value="present">Statut : Présent</option>
              </select>
              <button
                type="button"
                disabled={submitting || !selectedBeneficiaryId}
                onClick={enrollBeneficiary}
                className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] px-4')}
              >
                <UserPlus className="h-4 w-4" /> Inscrire
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrer les inscrits (nom, CIN, commune, téléphone)..."
              className="pl-9"
            />
          </div>

          {/* Mobile Cards inside Modal (< md) */}
          <div className="space-y-2.5 md:hidden">
            {filteredEnrolled.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun bénéficiaire inscrit dans cette session.
              </p>
            )}
            {filteredEnrolled.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {b.lastName} {b.firstName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {[b.commune, b.cin ? `CIN ${b.cin}` : null, b.phone].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => unenroll(b)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-destructive hover:bg-destructive/15"
                    title="Désinscrire"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2.5">
                  <select
                    value={b.attendanceStatus || 'enrolled'}
                    onChange={(e) => changeAttendance(b, e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                  >
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Présence : {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table inside Modal (>= md) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Bénéficiaire</th>
                  <th className="p-3 font-medium">CIN</th>
                  <th className="p-3 font-medium">Commune · Filière</th>
                  <th className="p-3 font-medium">Téléphone</th>
                  <th className="p-3 font-medium">Suivi de présence</th>
                  <th className="p-3 text-right font-medium">Désinscrire</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrolled.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">
                      {b.lastName} {b.firstName}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground tabular-nums">{b.cin || '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {[b.commune, b.category].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="p-3 text-muted-foreground tabular-nums">{b.phone || '—'}</td>
                    <td className="p-3">
                      <select
                        value={b.attendanceStatus || 'enrolled'}
                        onChange={(e) => changeAttendance(b, e.target.value as any)}
                        className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                      >
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => unenroll(b)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        title="Retirer de cette formation"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Retirer
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnrolled.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Aucun bénéficiaire inscrit dans cette session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
