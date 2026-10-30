import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remotePersonnel } from '@/lib/server/remote'
import {
  decorateStaffRecord,
  getLocalPersonnel,
  newId,
  saveLocalPersonnel,
  type EmploymentContractRecord,
  type StaffRecord,
} from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 5

function computeStats(list: StaffRecord[]) {
  const activeList = list.filter((s) => !s.deletedAt)
  const total = activeList.length
  const active = activeList.filter((s) => s.status === 'active').length
  const onLeave = activeList.filter((s) => s.status === 'on_leave').length
  const terminated = activeList.filter((s) => s.status === 'terminated').length

  const byDepartment: Record<string, number> = {}
  const byContractType: Record<string, number> = {
    CDI: 0,
    CDD: 0,
    Stage: 0,
    Consultant: 0,
    Prestation: 0,
  }
  let monthlyPayroll = 0
  let activeContractsCount = 0

  for (const s of activeList) {
    byDepartment[s.department] = (byDepartment[s.department] || 0) + 1
    const c = (s.contracts || []).find((x) => x.status === 'active') || s.contracts?.[0]
    if (c) {
      byContractType[c.contractType] = (byContractType[c.contractType] || 0) + 1
      if (s.status === 'active' && c.status === 'active') {
        activeContractsCount += 1
        monthlyPayroll += Number(c.salary) || 0
      }
    }
  }

  return {
    total,
    active,
    onLeave,
    terminated,
    activeContractsCount,
    monthlyPayroll,
    byDepartment,
    byContractType,
  }
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_personnel')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  const department = req.nextUrl.searchParams.get('department') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const contractType = req.nextUrl.searchParams.get('contractType') || undefined
  const pageNum = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)

  try {
    const [remoteList, remoteStats] = await Promise.all([
      remotePersonnel.list(q, department, status, contractType, String(pageNum), authHeader),
      remotePersonnel.stats(authHeader).catch(() => null),
    ])
    if (remoteList && Array.isArray(remoteList.items)) {
      return NextResponse.json(
        {
          ...remoteList,
          stats: remoteStats || undefined,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
  } catch {
    // Graceful fallback to runtime store if remote backend hasn't deployed /api/personnel yet
  }

  const allLocal = await getLocalPersonnel()
  const activeRecords = allLocal.filter((s) => !s.deletedAt)
  const stats = computeStats(activeRecords)

  const filtered = activeRecords
    .filter((s) => {
      if (department && s.department !== department) return false
      if (status && s.status !== status) return false
      if (contractType) {
        const hasContract = (s.contracts || []).some((c) => c.contractType === contractType)
        if (!hasContract) return false
      }
      if (q) {
        const term = q.toLowerCase()
        const hay = `${s.matricule} ${s.firstName} ${s.lastName} ${s.cin || ''} ${s.position} ${s.department} ${s.phone || ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
    .map(decorateStaffRecord)

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(pageNum, totalPages)
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return NextResponse.json(
    {
      items,
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
      stats,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_personnel')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body?.firstName?.trim() || !body?.lastName?.trim() || !body?.position?.trim()) {
    return NextResponse.json(
      { message: 'Le nom, le prénom et le poste sont requis.' },
      { status: 400 }
    )
  }

  try {
    const created = await remotePersonnel.create(body, authHeader)
    const item = created?.item || created
    if (item?.id) {
      return NextResponse.json(item, { status: 201 })
    }
  } catch (e: any) {
    if (e?.status && e.status !== 404 && e.status < 500) {
      return NextResponse.json({ message: e.message }, { status: e.status })
    }
  }

  const all = await getLocalPersonnel()
  if (body.cin?.trim() && all.some((s) => !s.deletedAt && s.cin === String(body.cin).trim())) {
    return NextResponse.json(
      { message: 'Ce numéro CIN est déjà utilisé par un membre du personnel.' },
      { status: 409 }
    )
  }

  const staffId = newId('staff')
  const nextNumber = String(all.length + 1).padStart(3, '0')
  const matricule = body.matricule?.trim() || `REK-RH-${nextNumber}`
  const nowIso = new Date().toISOString()

  const initialContract: EmploymentContractRecord | null = body.contract
    ? {
        id: newId('ctr'),
        staffId,
        contractType: body.contract.contractType || 'CDD',
        startDate: body.contract.startDate || body.hireDate || nowIso.slice(0, 10),
        endDate: body.contract.endDate || null,
        salary: Math.max(0, Number(body.contract.salary) || 0),
        assignmentLocation: body.contract.assignmentLocation?.trim() || null,
        status: body.contract.status || 'active',
        notes: body.contract.notes?.trim() || null,
      }
    : null

  const record: StaffRecord = {
    id: staffId,
    matricule,
    firstName: String(body.firstName).trim(),
    lastName: String(body.lastName).trim(),
    cin: body.cin?.trim() || null,
    sex: body.sex === 'F' ? 'F' : 'M',
    birthDate: body.birthDate || null,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    address: body.address?.trim() || null,
    position: String(body.position).trim(),
    department: body.department?.trim() || 'Coordination PDIMA',
    hireDate: body.hireDate || nowIso.slice(0, 10),
    status: body.status || 'active',
    evaluationScore:
      body.evaluationScore !== undefined && body.evaluationScore !== null && body.evaluationScore !== ''
        ? Number(body.evaluationScore)
        : null,
    professionalNotes: body.professionalNotes?.trim() || null,
    memberId: body.memberId || null,
    contracts: initialContract ? [initialContract] : [],
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  }

  await saveLocalPersonnel([record, ...all])
  return NextResponse.json(decorateStaffRecord(record), { status: 201 })
}
