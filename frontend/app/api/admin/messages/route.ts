import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteMessages } from '@/lib/server/remote'
import { readFileSync } from 'fs'
import { join } from 'path'

function readLocalMessages() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'messages.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_messages')
  if (res) return res
  try {
    const data = await remoteMessages.listThreads(authHeader)
    return NextResponse.json(data)
  } catch {
    const local = readLocalMessages()
    return NextResponse.json(local)
  }
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_messages')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ message: 'id requis' }, { status: 400 })
  try {
    await remoteMessages.update(body.id, {
      read: body.read,
      archived: body.archived,
      replies: body.replies,
    }, authHeader)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
