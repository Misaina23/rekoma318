import { NextResponse, type NextRequest } from 'next/server'
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
  }
  const list = await readJson<Message[]>('messages.json', [])
  const msg: Message = {
    id: crypto.randomUUID(),
    name: String(body.name).slice(0, 200),
    email: String(body.email).slice(0, 200),
    phone: body.phone ? String(body.phone).slice(0, 40) : '',
    subject: String(body.subject || '').slice(0, 200),
    message: String(body.message).slice(0, 5000),
    createdAt: new Date().toISOString(),
    read: false,
    archived: false,
    replies: [],
  }
  list.unshift(msg)
  await writeJson('messages.json', list)
  return NextResponse.json({ ok: true })
}
