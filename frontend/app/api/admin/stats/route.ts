import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { getBackendAuthHeader } from '@/lib/server/guard'
import {
  remoteActivities,
  remoteBeneficiaries,
  remoteDonations,
  remoteFormations,
  remoteMembers,
  remoteMessages,
  remotePersonnel,
  remotePublic,
  remoteStore,
} from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'
import {
  getBeneficiaryExtensions,
  getLocalPersonnel,
  getPivotState,
  getVisitsState,
  mergeFormationWithPivot,
} from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

function safeArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data.items)) return data.items as T[]
  return []
}

function safeDonations(data: any): { donations: any[]; totalCollected: number } {
  if (data && Array.isArray(data.donations)) return data
  if (Array.isArray(data)) return { donations: data, totalCollected: 0 }
  return { donations: [], totalCollected: 0 }
}

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Formation: 'Agriculture & SRI',
  Distribution: 'Distribution communautaire',
}

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const authHeader = getBackendAuthHeader(req, session)
  const day = new Date().toISOString().slice(0, 10)

  try {
    const [
      remoteDash,
      remoteVisits,
      localVisits,
      pivot,
      benefExtensions,
      localPersonnel,
      threads,
      members,
      activities,
      formations,
      beneficiariesPage,
      personnelPage,
      donations,
      ordersData,
    ] = await Promise.all([
      remotePublic.dashboardStats(authHeader).catch(() => null),
      remotePublic.getVisits().catch(() => null),
      getVisitsState(),
      getPivotState(),
      getBeneficiaryExtensions(),
      getLocalPersonnel(),
      remoteMessages.listThreads(authHeader).catch(() => null),
      remoteMembers.list(undefined, authHeader).catch(() => null),
      remoteActivities.list(undefined, undefined, '1', authHeader).catch(() => null),
      remoteFormations.list(undefined, undefined, undefined, undefined, '1', authHeader, true).catch(() => null),
      remoteBeneficiaries
        .list(undefined, undefined, undefined, undefined, undefined, undefined, '1', authHeader, true)
        .catch(() => null),
      remotePersonnel.list(undefined, undefined, undefined, undefined, '1', authHeader, true).catch(() => null),
      remoteDonations.list(undefined, authHeader).catch(() => null),
      remoteStore.orders(authHeader).catch(() => null),
    ])

    // 1. Visitors & Admin Connections
    const visitors = Math.max(
      Number(remoteDash?.visitors) || 0,
      Number(remoteVisits?.total) || 0,
      Number(localVisits.total) || 0
    )
    const visitorsToday = Math.max(
      Number(remoteDash?.visitorsToday) || 0,
      Number(remoteVisits?.today) || 0,
      Number(localVisits.days?.[day]) || 0
    )
    const uniqueVisitors = Math.max(
      Number(remoteVisits?.uniqueVisitors) || 0,
      localVisits.uniqueVisitors?.length || 0,
      visitors > 0 ? 1 : 0
    )
    const adminConnections = Math.max(
      Number(remoteDash?.adminConnections) || 0,
      Number(remoteVisits?.adminConnections) || 0,
      Number(localVisits.adminConnections) || 1
    )

    // 2. Beneficiaries & Sector Breakdown
    let beneficiariesList = safeArray(beneficiariesPage)
    if (
      beneficiariesPage &&
      Number(beneficiariesPage.totalPages) > 1 &&
      beneficiariesList.length < (Number(beneficiariesPage.total) || 0)
    ) {
      const moreB = await Promise.all(
        Array.from({ length: Math.min(Number(beneficiariesPage.totalPages) - 1, 10) }, (_, i) =>
          remoteBeneficiaries
            .list(undefined, undefined, undefined, undefined, undefined, undefined, String(i + 2), authHeader)
            .catch(() => ({ items: [] }))
        )
      )
      for (const p of moreB) beneficiariesList.push(...safeArray(p))
    }

    const cleanBeneficiaries = beneficiariesList.filter(
      (b: any) => (b.category || '') !== 'Emploi' || benefExtensions[b.id]?.category
    )
    const beneficiarySectors: Record<string, number> = {}
    const communesSet = new Set<string>()
    for (const b of cleanBeneficiaries) {
      const rawCat = benefExtensions[b.id]?.category || b.category || 'Agriculture & SRI'
      const cat = LEGACY_CATEGORY_MAP[rawCat] || rawCat
      beneficiarySectors[cat] = (beneficiarySectors[cat] || 0) + 1
      if (b.commune && String(b.commune).trim()) {
        communesSet.add(String(b.commune).trim().toLowerCase())
      }
    }
    const beneficiariesTotal = remoteDash?.beneficiariesTotal ?? cleanBeneficiaries.length
    const beneficiariesActive =
      remoteDash?.beneficiariesActive ??
      cleanBeneficiaries.filter((b: any) => b.status !== 'inactive').length

    // 3. Formations & Relational Pivot Participation Rate
    const localFormations = await readJson<any[]>('formations.json', [])
    let rawFormations = formations ? safeArray(formations) : localFormations
    if (
      formations &&
      Number(formations.totalPages) > 1 &&
      rawFormations.length < (Number(formations.total) || 0)
    ) {
      const moreF = await Promise.all(
        Array.from({ length: Math.min(Number(formations.totalPages) - 1, 8) }, (_, i) =>
          remoteFormations
            .list(undefined, undefined, undefined, undefined, String(i + 2), authHeader)
            .catch(() => ({ items: [] }))
        )
      )
      for (const p of moreF) rawFormations.push(...safeArray(p))
    }
    const mergedFormations = rawFormations
      .filter((f: any) => !f?.deletedAt)
      .map((f: any) => mergeFormationWithPivot(f, pivot))

    const formationsTotal = mergedFormations.length
    const activeFormations = mergedFormations.filter(
      (f: any) => f.status === 'ongoing' || f.status === 'planned'
    ).length
    const completedFormations = mergedFormations.filter((f: any) => f.status === 'done').length

    const totalEnrollments = mergedFormations.reduce(
      (s: number, f: any) => s + (Number(f.enrolledCount ?? f.participants) || 0),
      0
    )
    const presentEnrollments = mergedFormations.reduce(
      (s: number, f: any) => s + (Number(f.presentCount ?? f.attendees) || 0),
      0
    )
    const participationRate =
      totalEnrollments > 0
        ? Math.min(100, Math.round((presentEnrollments / totalEnrollments) * 100))
        : Number(remoteDash?.participationRate) || 0

    // 4. Personnel & Contracts
    const staffItems: any[] =
      personnelPage && Array.isArray(personnelPage.items)
        ? personnelPage.items
        : localPersonnel.filter((s) => !s.deletedAt)

    const personnelTotal = staffItems.length
    const personnelActive = staffItems.filter((s: any) => s.status === 'active').length
    const contractsBreakdown: Record<string, number> = {
      CDI: 0,
      CDD: 0,
      Stage: 0,
      Consultant: 0,
      Prestation: 0,
    }
    let monthlyPayroll = 0
    for (const s of staffItems) {
      const c =
        s.activeContract ||
        (Array.isArray(s.contracts) ? s.contracts.find((x: any) => x.status === 'active') || s.contracts[0] : null)
      if (c) {
        const ct = c.contractType || 'CDD'
        contractsBreakdown[ct] = (contractsBreakdown[ct] || 0) + 1
        if (s.status === 'active' && c.status === 'active') {
          monthlyPayroll += Number(c.salary) || 0
        }
      }
    }

    // 5. Governance, Activities, Donations, Store Orders & Messages
    const allMessages = threads ? safeArray(threads) : await readJson<any[]>('messages.json', [])
    const membersList = members ? safeArray(members) : await readJson<any[]>('members.json', [])
    const activitiesTotal = Number(activities?.total) || safeArray(activities).length
    const donationsData = donations
      ? safeDonations(donations)
      : { donations: await readJson<any[]>('donations.json', []), totalCollected: 0 }

    const localOrders = await readJson<any[]>('orders.json', [])
    const ordersList = Array.isArray(ordersData?.orders) ? ordersData!.orders : localOrders
    const ordersTotal = ordersList.length
    const ordersPending = ordersList.filter((o: any) => o.status === 'pending').length
    const storeRevenue = ordersList
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.total) || 0), 0)

    return NextResponse.json(
      {
        role: session.role,
        visitors,
        uniqueVisitors,
        visitorsToday,
        adminConnections,
        beneficiariesTotal,
        beneficiariesActive,
        beneficiariesCommunes: communesSet.size,
        beneficiarySectors,
        formations: formationsTotal,
        activeFormations,
        completedFormations,
        totalEnrollments,
        presentEnrollments,
        participationRate,
        personnelTotal,
        personnelActive,
        contractsBreakdown,
        monthlyPayroll,
        messages: allMessages.length,
        unread: allMessages.filter((m: any) => !m.read && !m.archived).length,
        members: membersList.length,
        activeMembers: membersList.filter((m: any) => m.status !== 'inactive').length,
        activities: activitiesTotal,
        donations: donationsData.donations.length,
        donationsCollected: donationsData.totalCollected || 0,
        ordersTotal,
        ordersPending,
        storeRevenue,
        day,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
