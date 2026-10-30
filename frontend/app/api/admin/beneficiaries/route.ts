import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries, remoteFormations } from '@/lib/server/remote'
import {
  getBeneficiaryExtensions,
  getPivotState,
  saveBeneficiaryExtension,
  getDeletedBeneficiaryIds,
  getLocalBeneficiaries,
  saveLocalBeneficiary,
} from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 5

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Formation: 'Agriculture & SRI',
  Distribution: 'Distribution communautaire',
}

function normalizeBeneficiary(
  b: any,
  extensions: Record<string, any>,
  pivotEnrollments: any[],
  unenrolledSet: Set<string>,
  formationsTitleMap: Map<string, { title: string; session?: string | null; status?: string | null }>
) {
  const ext = extensions[b.id] || {}
  const rawCategory = ext.category || b.category || 'Agriculture & SRI'
  const category =
    rawCategory === 'Emploi'
      ? 'Agriculture & SRI'
      : LEGACY_CATEGORY_MAP[rawCategory] || rawCategory

  // Collect relational formations from backend pivot OR local pivot bridge
  const followedMap = new Map<string, any>()
  if (Array.isArray(b.formations)) {
    for (const f of b.formations) {
      if (!f?.id || unenrolledSet.has(`${f.id}::${b.id}`)) continue
      followedMap.set(f.id, f)
    }
  } else if (b.formation?.id && !unenrolledSet.has(`${b.formation.id}::${b.id}`)) {
    followedMap.set(b.formation.id, {
      id: b.formation.id,
      title: b.formation.title,
      attendanceStatus: b.attendance ? 'present' : 'enrolled',
    })
  }

  for (const enr of pivotEnrollments) {
    if (enr.beneficiaryId !== b.id) continue
    if (unenrolledSet.has(`${enr.formationId}::${b.id}`)) continue
    const fMeta = formationsTitleMap.get(enr.formationId)
    followedMap.set(enr.formationId, {
      id: enr.formationId,
      title: fMeta?.title || 'Formation PDIMA',
      session: fMeta?.session || null,
      status: fMeta?.status || null,
      attendanceStatus: enr.attendanceStatus,
      evaluationScore: enr.evaluationScore,
      certificateIssued: enr.certificateIssued,
      enrolledAt: enr.enrolledAt,
    })
  }

  const formations = Array.from(followedMap.values())

  return {
    ...b,
    category,
    email: b.email ?? ext.email ?? null,
    fokontany: b.fokontany ?? ext.fokontany ?? null,
    householdSize: b.householdSize ?? ext.householdSize ?? null,
    notes: b.notes ?? ext.notes ?? null,
    formations,
    formationsCount: formations.length,
  }
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  const category = req.nextUrl.searchParams.get('category') || undefined
  const formationId = req.nextUrl.searchParams.get('formationId') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const sex = req.nextUrl.searchParams.get('sex') || undefined
  const commune = req.nextUrl.searchParams.get('commune') || undefined
  const all = req.nextUrl.searchParams.get('all') === '1'
  const pageNum = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)

  try {
    const [extensions, pivot, fmRes, deletedIdsList, localBeneficiaries] = await Promise.all([
      getBeneficiaryExtensions(),
      getPivotState(),
      remoteFormations.list(undefined, undefined, undefined, undefined, '1', authHeader, true).catch(() => null),
      getDeletedBeneficiaryIds(),
      getLocalBeneficiaries(),
    ])

    const deletedIdsSet = new Set(deletedIdsList || [])
    const formationsTitleMap = new Map<string, { title: string; session?: string | null; status?: string | null }>()
    for (const f of fmRes?.items || []) {
      formationsTitleMap.set(f.id, { title: f.title, session: f.session, status: f.status })
    }
    const unenrolledSet = new Set(pivot.unenrolledKeys || [])

    // Fetch pages from remote to ensure PAGE_SIZE=5 pagination and accurate relational filtering
    const firstPage = await remoteBeneficiaries.list(
      q,
      undefined,
      undefined,
      status,
      sex,
      commune,
      '1',
      authHeader,
      true
    ).catch(() => ({ items: [], totalPages: 1 }))

    let allItems: any[] = Array.isArray(firstPage?.items) ? [...firstPage.items] : []
    const remoteTotalPages = Number(firstPage?.totalPages) || 1
    if (remoteTotalPages > 1 && allItems.length < (Number(firstPage?.total) || 0)) {
      const restPages = await Promise.all(
        Array.from({ length: Math.min(remoteTotalPages - 1, 15) }, (_, idx) =>
          remoteBeneficiaries
            .list(q, undefined, undefined, status, sex, commune, String(idx + 2), authHeader)
            .catch(() => ({ items: [] }))
        )
      )
      for (const p of restPages) {
        if (Array.isArray(p?.items)) allItems.push(...p.items)
      }
    }

    // Merge remote items and local beneficiaries, skipping any deleted ones
    const itemMap = new Map<string, any>()
    for (const b of allItems) {
      if (!b?.id || deletedIdsSet.has(b.id)) continue
      itemMap.set(b.id, b)
    }
    for (const lb of localBeneficiaries || []) {
      if (!lb?.id || deletedIdsSet.has(lb.id)) continue
      // Local may contain fresher updates
      itemMap.set(lb.id, { ...(itemMap.get(lb.id) || {}), ...lb })
    }

    const mergedItems = Array.from(itemMap.values())

    let normalized = mergedItems
      .filter((b) => (b.category || '') !== 'Emploi' || extensions[b.id]?.category)
      .map((b) =>
        normalizeBeneficiary(b, extensions, pivot.enrollments || [], unenrolledSet, formationsTitleMap)
      )

    if (category) {
      normalized = normalized.filter((b) => b.category === category)
    }
    if (formationId) {
      normalized = normalized.filter((b) =>
        (b.formations || []).some((f: any) => f.id === formationId)
      )
    }

    const total = normalized.length
    if (all) {
      return NextResponse.json(
        { items: normalized, total, page: 1, pageSize: total || PAGE_SIZE, totalPages: 1 },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(pageNum, totalPages)
    const slice = normalized.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

    return NextResponse.json(
      {
        items: slice,
        total,
        page: safePage,
        pageSize: PAGE_SIZE,
        totalPages,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.firstName?.trim() || !body?.lastName?.trim()) {
    return NextResponse.json({ message: 'Nom et prénom requis' }, { status: 400 })
  }

  const firstName = String(body.firstName).trim()
  const lastName = String(body.lastName).trim()
  const payload = {
    firstName,
    lastName,
    name: body.name?.trim() || `${lastName} ${firstName}`,
    cin: body.cin ? String(body.cin).trim() : null,
    birthDate: body.birthDate || null,
    sex: body.sex === 'F' ? 'F' : 'M',
    phone: body.phone ? String(body.phone).trim() : null,
    email: body.email ? String(body.email).trim() : null,
    address: body.address ? String(body.address).trim() : null,
    commune: body.commune ? String(body.commune).trim() : null,
    fokontany: body.fokontany ? String(body.fokontany).trim() : null,
    householdSize:
      body.householdSize !== undefined && body.householdSize !== '' && body.householdSize !== null
        ? Math.max(1, Number(body.householdSize) || 1)
        : null,
    category: body.category && body.category !== 'Emploi' ? String(body.category) : 'Agriculture & SRI',
    contact: body.contact ? String(body.contact).trim() : body.phone ? String(body.phone).trim() : null,
    status: body.status || 'active',
    notes: body.notes ? String(body.notes).trim() : null,
  }

  try {
    let item: any = null
    try {
      const created = await remoteBeneficiaries.create(payload, authHeader)
      item = created?.item || created
    } catch (remoteErr: any) {
      console.warn('remote create error, saving locally fallback:', remoteErr.message)
      const crypto = await import('crypto')
      item = {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    if (item?.id) {
      await saveBeneficiaryExtension(item.id, {
        email: payload.email,
        fokontany: payload.fokontany,
        householdSize: payload.householdSize,
        notes: payload.notes,
        category: payload.category,
      })
      await saveLocalBeneficiary({
        ...item,
        email: payload.email,
        fokontany: payload.fokontany,
        householdSize: payload.householdSize,
        notes: payload.notes,
        category: payload.category,
      })
    }

    return NextResponse.json(
      {
        ...item,
        email: payload.email,
        fokontany: payload.fokontany,
        householdSize: payload.householdSize,
        notes: payload.notes,
        category: payload.category,
        formations: item?.formations || [],
        formationsCount: item?.formationsCount || 0,
      },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
