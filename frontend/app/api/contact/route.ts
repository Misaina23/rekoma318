import { NextResponse, type NextRequest } from 'next/server'
import { remotePublic } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
  }
  try {
    await remotePublic.postMessage({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
