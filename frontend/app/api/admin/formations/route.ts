import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

type Formation = {
  id: string
  title: string
  session: string
  date: string
  participants: number
  attendees: number
  evaluation: number
  certificate: boolean
  status: 'planned' | 'ongoing' | 'done'
}

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  return NextResponse.json(await readJson<Formation[]>('formations.json', []))
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ message: 'Titre requis' }, { status: 400 })
  const list = await readJson<Formation[]>('formations.json', [])
  const item: Formation = {
    id: crypto.randomUUID(),
    title: String(body.title).slice(0, 200),
    session: String(body.session || '').slice(0, 120),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    participants: Number(body.participants) || 0,
    attendees: Number(body.attendees) || 0,
    evaluation: Number(body.evaluation) || 0,
    certificate: Boolean(body.certificate),
    status: body.status || 'planned',
  }
  list.unshift(item)
  await writeJson('formations.json', list)
  return NextResponse.json(item, { status: 201 })
}
