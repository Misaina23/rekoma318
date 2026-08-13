import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('rekoma_admin')?.value
  if (!sessionCookie) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.code || String(body.code).length < 4) {
    return NextResponse.json({ message: 'Code invalide' }, { status: 400 })
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json({ message: 'Session invalide' }, { status: 401 })
  }
  if (!payload?.email || !payload?.password) {
    return NextResponse.json({ message: 'Session invalide' }, { status: 401 })
  }

  try {
    const r = await fetch(`${API}/api/verification/2fa/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: payload.email, code: body.code }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Code incorrect' }, { status: r.status })

    const adminRes = NextResponse.json({ ok: true, verified: true, user: data.user })
    adminRes.cookies.set('rekoma_admin', Buffer.from(JSON.stringify({ email: data.user.email, role: data.user.role })).toString('base64'), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return adminRes
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur' }, { status: 500 })
  }
}
