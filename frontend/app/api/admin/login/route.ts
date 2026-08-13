import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Email et mot de passe requis' }, { status: 400 })
  }

  try {
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
      credentials: 'include',
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      if (r.status === 403 && data.error?.includes('Email non vérifié')) {
        return NextResponse.json({ message: 'Email non vérifié. Vérifiez votre adresse email.' }, { status: 403 })
      }
      return NextResponse.json({ message: data.error || 'Identifiants invalides' }, { status: r.status })
    }

    const user = data.user || {}
    const sessionPayload = JSON.stringify({ email: user.email, password: body.password })
    const adminRes = NextResponse.json({ ok: true, user })
    adminRes.cookies.set('rekoma_admin', Buffer.from(sessionPayload).toString('base64'), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    })
    return adminRes
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur' }, { status: 500 })
  }
}
