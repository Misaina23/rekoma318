import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const { res, session, authHeader } = requireAuth(req)
  if (res || !session) return res || NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

  try {
    const r = await fetch(`${API}/api/verification/2fa/request`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify({ email: session.email }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Échec de l’envoi du code 2FA' }, { status: r.status })
    return NextResponse.json({
      ok: true,
      sessionId: data.sessionId,
      emailSent: data.emailSent,
      message: data.message,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
