import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('rekoma_admin')?.value
  if (!sessionCookie) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

  let payload
  try {
    payload = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json({ message: 'Session invalide' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const sessionId = body?.sessionId || payload?.sessionId
  if (!sessionId) return NextResponse.json({ message: 'Session requise' }, { status: 400 })

  try {
    const r = await fetch(`${API}/api/verification/2fa/resend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Impossible de renvoyer le code' }, { status: r.status })
    return NextResponse.json({ ok: true, sessionId: data.sessionId })
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur' }, { status: 500 })
  }
}
