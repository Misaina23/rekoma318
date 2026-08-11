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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const body = await req.json().catch(() => null)
  const list = await readJson<Formation[]>('formations.json', [])
  const idx = list.findIndex((f) => f.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
  list[idx] = { ...list[idx], ...body, title: String(body.title ?? list[idx].title).slice(0, 200) }
  await writeJson('formations.json', list)
  return NextResponse.json(list[idx])
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const list = await readJson<Formation[]>('formations.json', [])
  await writeJson('formations.json', list.filter((f) => f.id !== params.id))
  return NextResponse.json({ ok: true })
}
