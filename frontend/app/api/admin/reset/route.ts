import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token = String(body?.token || '').trim()
  const password = String(body?.password || '')

  if (!token || password.length < 8) {
    return NextResponse.json({ message: 'Token et mot de passe (min 8) requis' }, { status: 400 })
  }

  try {
    const r = await fetch(`${API}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Impossible de réinitialiser le mot de passe' }, { status: r.status })
    return NextResponse.json({ ok: true, message: data.message || 'Mot de passe réinitialisé.' })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur' }, { status: 500 })
  }
}
