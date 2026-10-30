import crypto from 'crypto'
import { readJson, writeJson } from './store'

export type PivotEnrollmentRecord = {
  id: string
  formationId: string
  beneficiaryId: string
  attendanceStatus: 'enrolled' | 'present' | 'absent' | 'completed'
  evaluationScore: number | null
  certificateIssued: boolean
  notes: string | null
  enrolledAt: string
  beneficiary?: {
    id: string
    firstName: string
    lastName: string
    cin?: string | null
    phone?: string | null
    commune?: string | null
    fokontany?: string | null
    category?: string | null
    address?: string | null
    status?: string | null
  }
}

export type PivotStoreState = {
  enrollments: PivotEnrollmentRecord[]
  unenrolledKeys: string[] // `${formationId}::${beneficiaryId}`
}

export type BeneficiaryExtension = {
  email?: string | null
  fokontany?: string | null
  householdSize?: number | null
  notes?: string | null
  category?: string | null
}

export type EmploymentContractRecord = {
  id: string
  staffId: string
  contractType: 'CDI' | 'CDD' | 'Stage' | 'Consultant' | 'Prestation'
  startDate: string
  endDate: string | null
  salary: number
  assignmentLocation: string | null
  status: 'active' | 'expired' | 'terminated'
  notes: string | null
}

export type StaffRecord = {
  id: string
  matricule: string
  firstName: string
  lastName: string
  cin: string | null
  sex: 'M' | 'F'
  birthDate: string | null
  phone: string | null
  email: string | null
  address: string | null
  position: string
  department: string
  hireDate: string
  status: 'active' | 'on_leave' | 'terminated'
  evaluationScore: number | null
  professionalNotes: string | null
  memberId: string | null
  contracts: EmploymentContractRecord[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type VisitsStoreState = {
  total: number
  uniqueVisitors: string[]
  days: Record<string, number>
  topPages: Record<string, number>
  adminConnections: number
  adminDays: Record<string, number>
}

export async function getPivotState(): Promise<PivotStoreState> {
  return readJson<PivotStoreState>('formation_beneficiaire_pivot.json', {
    enrollments: [],
    unenrolledKeys: [],
  })
}

export async function savePivotState(state: PivotStoreState) {
  await writeJson('formation_beneficiaire_pivot.json', state)
}

export async function getBeneficiaryExtensions(): Promise<Record<string, BeneficiaryExtension>> {
  return readJson<Record<string, BeneficiaryExtension>>('beneficiary_extensions.json', {})
}

export async function saveBeneficiaryExtension(id: string, ext: BeneficiaryExtension) {
  const all = await getBeneficiaryExtensions()
  all[id] = { ...(all[id] || {}), ...ext }
  await writeJson('beneficiary_extensions.json', all)
}

export async function getDeletedBeneficiaryIds(): Promise<string[]> {
  return readJson<string[]>('deleted_beneficiaries.json', [])
}

export async function markBeneficiaryDeleted(id: string): Promise<void> {
  const list = await getDeletedBeneficiaryIds()
  if (!list.includes(id)) {
    list.push(id)
    await writeJson('deleted_beneficiaries.json', list)
  }
  const extensions = await getBeneficiaryExtensions()
  if (extensions[id]) {
    delete extensions[id]
    await writeJson('beneficiary_extensions.json', extensions)
  }
  const locals = await getLocalBeneficiaries()
  await writeJson(
    'local_beneficiaries.json',
    locals.filter((b) => b.id !== id)
  )
}

export async function unmarkBeneficiaryDeleted(id: string): Promise<void> {
  const list = await getDeletedBeneficiaryIds()
  if (list.includes(id)) {
    await writeJson('deleted_beneficiaries.json', list.filter((item) => item !== id))
  }
}

export async function getLocalBeneficiaries(): Promise<any[]> {
  return readJson<any[]>('local_beneficiaries.json', [])
}

export async function saveLocalBeneficiary(item: any): Promise<void> {
  await unmarkBeneficiaryDeleted(item.id)
  const list = await getLocalBeneficiaries()
  await writeJson('local_beneficiaries.json', [item, ...list.filter((b) => b.id !== item.id)])
}

const DEFAULT_STAFF_SEED: StaffRecord[] = []

export async function getLocalPersonnel(): Promise<StaffRecord[]> {
  return readJson<StaffRecord[]>('personnel_records.json', DEFAULT_STAFF_SEED)
}

export async function saveLocalPersonnel(list: StaffRecord[]) {
  await writeJson('personnel_records.json', list)
}

export function decorateStaffRecord(s: StaffRecord) {
  const contracts = Array.isArray(s.contracts) ? s.contracts : []
  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0] || null
  return {
    ...s,
    activeContract,
    contractType: activeContract?.contractType || null,
    salary: activeContract?.salary || 0,
    assignmentLocation: activeContract?.assignmentLocation || null,
    contractStartDate: activeContract?.startDate || null,
    contractEndDate: activeContract?.endDate || null,
  }
}

export function buildLast14Days(): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(now.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export async function getVisitsState(): Promise<VisitsStoreState> {
  return readJson<VisitsStoreState>('visits_runtime.json', {
    total: 0,
    uniqueVisitors: [],
    days: {},
    topPages: {},
    adminConnections: 0,
    adminDays: {},
  })
}

export async function recordRuntimeVisit(opts: {
  path?: string
  visitorId?: string
  isAdmin?: boolean
}) {
  const state = await getVisitsState()
  const day = new Date().toISOString().slice(0, 10)
  const cleanPath = (opts.path || '/').split('?')[0].slice(0, 120) || '/'

  if (opts.isAdmin) {
    state.adminConnections = (state.adminConnections || 0) + 1
    state.adminDays[day] = (state.adminDays[day] || 0) + 1
  } else {
    state.total = (state.total || 0) + 1
    state.days[day] = (state.days[day] || 0) + 1
    state.topPages[cleanPath] = (state.topPages[cleanPath] || 0) + 1
    if (opts.visitorId && !state.uniqueVisitors.includes(opts.visitorId)) {
      state.uniqueVisitors = [...state.uniqueVisitors.slice(-499), opts.visitorId]
    }
  }

  await writeJson('visits_runtime.json', state)
  return state
}

export function mergeFormationWithPivot(
  formation: any,
  pivot: PivotStoreState
) {
  const fId = String(formation.id)
  const unenrolledSet = new Set(pivot.unenrolledKeys || [])

  // Start with backend enrollments if present, otherwise legacy formation.beneficiaries
  const byBeneficiary = new Map<string, PivotEnrollmentRecord>()

  if (Array.isArray(formation.enrollments)) {
    for (const e of formation.enrollments) {
      const bId = String(e.beneficiaryId || e.beneficiary?.id || '')
      if (!bId || unenrolledSet.has(`${fId}::${bId}`)) continue
      byBeneficiary.set(bId, {
        id: e.id || `enr_${fId}_${bId}`,
        formationId: fId,
        beneficiaryId: bId,
        attendanceStatus: e.attendanceStatus || 'enrolled',
        evaluationScore: e.evaluationScore ?? null,
        certificateIssued: Boolean(e.certificateIssued),
        notes: e.notes || null,
        enrolledAt: e.enrolledAt || new Date().toISOString(),
        beneficiary: e.beneficiary,
      })
    }
  } else if (Array.isArray(formation.beneficiaries)) {
    for (const b of formation.beneficiaries) {
      const bId = String(b.id || '')
      if (!bId || unenrolledSet.has(`${fId}::${bId}`)) continue
      byBeneficiary.set(bId, {
        id: b.enrollmentId || `legacy_${fId}_${bId}`,
        formationId: fId,
        beneficiaryId: bId,
        attendanceStatus:
          b.attendanceStatus ||
          (b.attendance && b.attendance !== '' ? 'present' : 'enrolled'),
        evaluationScore: b.evaluationScore ?? null,
        certificateIssued: Boolean(b.certificateIssued),
        notes: null,
        enrolledAt: b.enrolledAt || formation.date || new Date().toISOString(),
        beneficiary: b,
      })
    }
  }

  for (const localEnr of pivot.enrollments || []) {
    if (localEnr.formationId !== fId) continue
    if (unenrolledSet.has(`${fId}::${localEnr.beneficiaryId}`)) continue
    const prev = byBeneficiary.get(localEnr.beneficiaryId)
    byBeneficiary.set(localEnr.beneficiaryId, {
      ...prev,
      ...localEnr,
      beneficiary: localEnr.beneficiary || prev?.beneficiary,
    })
  }

  const enrollments = Array.from(byBeneficiary.values())
  const enrolledCount = enrollments.length
  const presentCount = enrollments.filter(
    (e) => e.attendanceStatus === 'present' || e.attendanceStatus === 'completed'
  ).length

  const participants = enrolledCount > 0 ? enrolledCount : Number(formation.participants) || 0
  const attendees = enrolledCount > 0 ? presentCount : Number(formation.attendees) || 0
  const participationRate =
    participants > 0 ? Math.min(100, Math.round((attendees / participants) * 100)) : 0

  return {
    ...formation,
    capacity: Number(formation.capacity) || 30,
    participants,
    attendees,
    enrolledCount,
    presentCount,
    participationRate,
    enrollments,
    beneficiaries: enrollments.map((e) => ({
      ...(e.beneficiary || {}),
      id: e.beneficiaryId,
      enrollmentId: e.id,
      attendanceStatus: e.attendanceStatus,
      attendance: e.attendanceStatus,
      evaluationScore: e.evaluationScore,
      certificateIssued: e.certificateIssued,
      enrolledAt: e.enrolledAt,
    })),
  }
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 12)}`
}
