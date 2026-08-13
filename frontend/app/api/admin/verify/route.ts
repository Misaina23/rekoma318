import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.code || String(body.code).length < 4) {
    return NextResponse.json({ message: 'Code invalide' }, { status: 400 })
  }
  try {
    const r = await fetch(`${API}/api/verification/2fa/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: session.email, code: body.code }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Code incorrect' }, { status: r.status })
    return NextResponse.json({ ok: true, verified: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
