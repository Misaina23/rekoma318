import { NextResponse, type NextRequest } from 'next/server'
import { remotePublic } from '@/lib/server/remote'
import { buildLast14Days, getVisitsState, recordRuntimeVisit } from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/projets': 'Projets PDIMA',
  '/impact': 'Impact & Résultats',
  '/articles': 'Boutique solidaire',
  '/dons': 'Faire un don',
  '/actualites': 'Actualités',
  '/galerie': 'Galerie',
  '/documents': 'Documents',
  '/gouvernance': 'Gouvernance',
  '/a-propos': 'À propos',
  '/contact': 'Contact',
}

export async function GET() {
  const last14 = buildLast14Days()
  const local = await getVisitsState()
  const today = new Date().toISOString().slice(0, 10)

  let remoteData: any = null
  try {
    remoteData = await remotePublic.getVisits()
  } catch {
    // Backend may still be on older deploy without GET /api/visits
  }

  const days: Record<string, number> = {}
  for (const d of last14) {
    const rCount = Number(remoteData?.days?.[d]) || 0
    const lCount = Number(local.days?.[d]) || 0
    days[d] = Math.max(rCount, lCount)
  }

  const total = Math.max(Number(remoteData?.total) || 0, Number(local.total) || 0)
  const todayViews = Math.max(Number(remoteData?.today) || 0, Number(local.days?.[today]) || 0)
  const uniqueVisitors = Math.max(
    Number(remoteData?.uniqueVisitors) || 0,
    local.uniqueVisitors?.length || 0,
    total > 0 ? 1 : 0
  )
  const adminConnections = Math.max(
    Number(remoteData?.adminConnections) || 0,
    Number(local.adminConnections) || 0
  )

  let topPages: { path: string; name: string; views: number }[] = []
  if (Array.isArray(remoteData?.topPages) && remoteData.topPages.length > 0) {
    topPages = remoteData.topPages.map((p: any) => ({
      path: p.path || '/',
      name: PAGE_LABELS[p.path || '/'] || p.path || 'Accueil',
      views: Number(p.views) || 0,
    }))
  } else {
    topPages = Object.entries(local.topPages || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([p, views]) => ({
        path: p,
        name: PAGE_LABELS[p] || p,
        views,
      }))
  }

  return NextResponse.json(
    {
      total,
      uniqueVisitors,
      today: todayViews,
      adminConnections,
      days,
      topPages,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const path = typeof body?.path === 'string' ? body.path : '/'
  const visitorId = typeof body?.visitorId === 'string' ? body.visitorId : undefined
  const isAdmin = Boolean(body?.isAdmin) || path.startsWith('/admin')

  const state = await recordRuntimeVisit({ path, visitorId, isAdmin })

  try {
    await remotePublic.postVisit({ path, visitorId, isAdmin })
  } catch {
    // Non-blocking if backend is waking up
  }

  return NextResponse.json({
    ok: true,
    total: state.total,
    adminConnections: state.adminConnections,
  })
}
