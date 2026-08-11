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

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_activities')
  if (res) return res
  return NextResponse.json(await readJson<Activity[]>('activities.json', []))
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_activities')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ message: 'Titre requis' }, { status: 400 })
  const list = await readJson<Activity[]>('activities.json', [])
  const item: Activity = {
    id: crypto.randomUUID(),
    title: String(body.title).slice(0, 200),
    responsible: String(body.responsible || '').slice(0, 120),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    budget: Number(body.budget) || 0,
    objectives: String(body.objectives || '').slice(0, 1000),
    participants: Number(body.participants) || 0,
    results: String(body.results || '').slice(0, 1000),
    photos: Array.isArray(body.photos) ? body.photos.slice(0, 20) : [],
    documents: Array.isArray(body.documents) ? body.documents.slice(0, 20) : [],
    status: body.status || 'planned',
  }
  list.unshift(item)
  await writeJson('activities.json', list)
  return NextResponse.json(item, { status: 201 })
}
