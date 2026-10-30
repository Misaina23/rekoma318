import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteFormations } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import { getPivotState, mergeFormationWithPivot } from '@/lib/server/relational'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 5

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const from = req.nextUrl.searchParams.get('from') || undefined
  const to = req.nextUrl.searchParams.get('to') || undefined
  const all = req.nextUrl.searchParams.get('all') === '1'
  const pageNum = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)

  const pivot = await getPivotState()

  try {
    const first = await remoteFormations.list(q, status, from, to, '1', authHeader, true)
    if (first && Array.isArray(first.items)) {
      let allItems = [...first.items]
      const remotePages = Number(first.totalPages) || 1
      if (remotePages > 1 && allItems.length < (Number(first.total) || 0)) {
        const more = await Promise.all(
          Array.from({ length: Math.min(remotePages - 1, 10) }, (_, i) =>
            remoteFormations
              .list(q, status, from, to, String(i + 2), authHeader)
              .catch(() => ({ items: [] }))
          )
        )
        for (const p of more) {
          if (Array.isArray(p?.items)) allItems.push(...p.items)
        }
      }

      const merged = allItems.map((f) => mergeFormationWithPivot(f, pivot))
      const total = merged.length
      if (all) {
        return NextResponse.json(
          { items: merged, total, page: 1, pageSize: total || PAGE_SIZE, totalPages: 1 },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        )
      }

      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
      const safePage = Math.min(pageNum, totalPages)
      const slice = merged.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

      return NextResponse.json(
        {
          items: slice,
          total,
          page: safePage,
          pageSize: PAGE_SIZE,
          totalPages,
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }
  } catch (e: any) {
    console.warn('remoteFormations.list failed, reading runtime store:', e.message)
  }

  const local = await readJson<any[]>('formations.json', [])
  const filtered = local
    .filter((f) => {
      if (f?.deletedAt) return false
      if (status && f.status !== status) return false
      if (q && !f.title?.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    .map((f) => mergeFormationWithPivot(f, pivot))

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(pageNum, totalPages)
  const slice = all ? filtered : filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return NextResponse.json(
    {
      items: slice,
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body?.title?.trim()) {
    return NextResponse.json({ message: 'Le titre de la formation est requis.' }, { status: 400 })
  }

  const cleanFormation = {
    title: String(body.title).trim().slice(0, 200),
    description: String(body.description || '').trim().slice(0, 2000),
    session: String(body.session || '').trim().slice(0, 100),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    location: String(body.location || '').trim().slice(0, 200),
    trainer: String(body.trainer || '').trim().slice(0, 150),
    trainerStaffId: body.trainerStaffId || null,
    date: body.date || new Date().toISOString(),
    capacity: Math.max(1, Number(body.capacity) || 30),
    participants: 0,
    attendees: 0,
    evaluation: Number(body.evaluation) || 0,
    certificate: Boolean(body.certificate),
    status: body.status || 'planned',
  }

  try {
    const created = await remoteFormations.create(cleanFormation, authHeader)
    const item = created?.item || created
    if (item && item.id) {
      const list = await readJson<any[]>('formations.json', [])
      await writeJson('formations.json', [item, ...list.filter((f) => f.id !== item.id)])
      return NextResponse.json(
        {
          ...item,
          capacity: cleanFormation.capacity,
          enrollments: item.enrollments || [],
          beneficiaries: item.beneficiaries || [],
          participationRate: item.participationRate || 0,
        },
        { status: 201 }
      )
    }
  } catch (e: any) {
    const status = Number(e?.status) || 0
    if (status >= 400 && status < 500) {
      return NextResponse.json({ message: e.message || 'Impossible de créer la formation.' }, { status })
    }
    console.warn('remoteFormations.create failed, falling back to runtime store:', e.message)
  }

  const list = await readJson<any[]>('formations.json', [])
  const newItem = {
    id: crypto.randomUUID(),
    ...cleanFormation,
    enrollments: [],
    beneficiaries: [],
    participationRate: 0,
  }
  await writeJson('formations.json', [newItem, ...list])
  return NextResponse.json(newItem, { status: 201 })
}
