import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

type Activity = {
  id: string
  title: string
  responsible: string
  date: string
  budget: number
  objectives: string
  participants: number
  results: string
  photos: string[]
  documents: string[]
  status: 'planned' | 'ongoing' | 'done'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_activities')
  if (res) return res
  const body = await req.json().catch(() => null)
  const list = await readJson<Activity[]>('activities.json', [])
  const idx = list.findIndex((a) => a.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
  list[idx] = { ...list[idx], ...body, title: String(body.title ?? list[idx].title).slice(0, 200) }
  await writeJson('activities.json', list)
  return NextResponse.json(list[idx])
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_activities')
  if (res) return res
  const list = await readJson<Activity[]>('activities.json', [])
  await writeJson('activities.json', list.filter((a) => a.id !== params.id))
  return NextResponse.json({ ok: true })
}
