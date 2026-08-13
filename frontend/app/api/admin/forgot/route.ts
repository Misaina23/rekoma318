import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email || '').trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Email invalide' }, { status: 400 })
  }

  try {
    const r = await fetch(`${API}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Impossible d\'envoyer l\'email' }, { status: r.status })
    return NextResponse.json({ ok: true, message: data.message || 'Email de réinitialisation envoyé.' })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur' }, { status: 500 })
  }
}
