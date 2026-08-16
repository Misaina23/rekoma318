import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteMessages } from '@/lib/server/remote'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_messages')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  try {
    await remoteMessages.remove(params.id, authHeader)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_messages')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  const body = await req.json().catch(() => null)
  if (!body?.body) return NextResponse.json({ message: 'body requis' }, { status: 400 })
  try {
    const data = await remoteMessages.reply(params.id, 'REKOMA', body.body, authHeader)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
