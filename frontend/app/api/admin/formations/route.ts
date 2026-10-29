import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteFormations } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const from = req.nextUrl.searchParams.get('from') || undefined
  const to = req.nextUrl.searchParams.get('to') || undefined
  const page = req.nextUrl.searchParams.get('page') || undefined

  try {
    const data = await remoteFormations.list(q, status, from, to, page, authHeader)
    if (data && Array.isArray(data.items)) {
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      })
    }
  } catch (e: any) {
    console.warn('remoteFormations.list failed, reading local store:', e.message)
  }

  const local = await readJson<any[]>('formations.json', [])
  const filtered = local.filter((f) => {
    if (f?.deletedAt) return false
    if (status && f.status !== status) return false
    if (q && !f.title?.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return NextResponse.json(
    {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
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
    date: body.date || new Date().toISOString(),
    participants: Number(body.participants) || 0,
    attendees: Number(body.attendees) || 0,
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
      return NextResponse.json(item, { status: 201 })
    }
  } catch (e: any) {
    const status = Number(e?.status) || 0
    if (status >= 400 && status < 500) {
      return NextResponse.json({ message: e.message || 'Impossible de créer la formation.' }, { status })
    }
    console.warn('remoteFormations.create failed, falling back to local store:', e.message)
  }

  const list = await readJson<any[]>('formations.json', [])
  const newItem = {
    id: crypto.randomUUID(),
    ...cleanFormation,
    beneficiaries: [],
  }
  await writeJson('formations.json', [newItem, ...list])
  return NextResponse.json(newItem, { status: 201 })
}
