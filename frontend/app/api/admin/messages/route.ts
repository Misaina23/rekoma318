import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

type Message = {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  createdAt: string
  read: boolean
  archived: boolean
  replies: { from: string; body: string; at: string }[]
}

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_messages')
  if (res) return res
  const list = await readJson<Message[]>('messages.json', [])
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_messages')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ message: 'id requis' }, { status: 400 })
  const list = await readJson<Message[]>('messages.json', [])
  const idx = list.findIndex((m) => m.id === body.id)
  if (idx === -1) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
  const cur = list[idx]
  list[idx] = {
    ...cur,
    read: body.read !== undefined ? Boolean(body.read) : cur.read,
    archived: body.archived !== undefined ? Boolean(body.archived) : cur.archived,
    replies: Array.isArray(body.replies) ? body.replies : cur.replies,
  }
  await writeJson('messages.json', list)
  return NextResponse.json({ ok: true })
}
