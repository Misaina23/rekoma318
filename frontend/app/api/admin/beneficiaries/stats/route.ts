import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries } from '@/lib/server/remote'
import { getBeneficiaryExtensions, getPivotState } from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  'Agriculture & SRI',
  'Maraîchage',
  'Élevage avicole',
  'Eau & WASH',
  'Distribution communautaire',
  'Autre',
]

const LEGACY_MAP: Record<string, string> = {
  Formation: 'Agriculture & SRI',
  Distribution: 'Distribution communautaire',
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res

  try {
    const [extensions, pivot, firstPage] = await Promise.all([
      getBeneficiaryExtensions(),
      getPivotState(),
      remoteBeneficiaries
        .list(undefined, undefined, undefined, undefined, undefined, undefined, '1', authHeader, true)
        .catch(() => ({ items: [], totalPages: 1 })),
    ])

    let allItems: any[] = Array.isArray(firstPage?.items) ? [...firstPage.items] : []
    const totalPages = Number(firstPage?.totalPages) || 1
    if (totalPages > 1 && allItems.length < (Number(firstPage?.total) || 0)) {
      const rest = await Promise.all(
        Array.from({ length: Math.min(totalPages - 1, 15) }, (_, idx) =>
          remoteBeneficiaries
            .list(undefined, undefined, undefined, undefined, undefined, undefined, String(idx + 2), authHeader)
            .catch(() => ({ items: [] }))
        )
      )
      for (const p of rest) {
        if (Array.isArray(p?.items)) allItems.push(...p.items)
      }
    }

    const valid = allItems.filter((b) => (b.category || '') !== 'Emploi' || extensions[b.id]?.category)
    const breakdown: Record<string, number> = {}
    for (const c of CATEGORIES) breakdown[c] = 0

    const communesSet = new Set<string>()
    let householdsTotal = 0
    let active = 0
    const enrolledBeneficiaryIds = new Set<string>()
    const unenrolledSet = new Set(pivot.unenrolledKeys || [])

    for (const b of valid) {
      const ext = extensions[b.id] || {}
      const rawCat = ext.category || b.category || 'Agriculture & SRI'
      const cat = LEGACY_MAP[rawCat] || rawCat
      breakdown[cat] = (breakdown[cat] || 0) + 1
      if (b.status !== 'inactive') active += 1
      if (b.commune && String(b.commune).trim()) communesSet.add(String(b.commune).trim().toLowerCase())
      householdsTotal += Number(b.householdSize ?? ext.householdSize ?? 0) || 0
      if (Array.isArray(b.formations) && b.formations.length > 0) {
        enrolledBeneficiaryIds.add(b.id)
      } else if (b.formation?.id && !unenrolledSet.has(`${b.formation.id}::${b.id}`)) {
        enrolledBeneficiaryIds.add(b.id)
      }
    }

    for (const enr of pivot.enrollments || []) {
      if (!unenrolledSet.has(`${enr.formationId}::${enr.beneficiaryId}`)) {
        enrolledBeneficiaryIds.add(enr.beneficiaryId)
      }
    }

    return NextResponse.json(
      {
        total: valid.length,
        active,
        communesCount: communesSet.size,
        householdsTotal,
        enrolledInFormations: enrolledBeneficiaryIds.size,
        breakdown,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
