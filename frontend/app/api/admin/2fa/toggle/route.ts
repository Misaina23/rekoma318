import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req)
  if (res) return res

  try {
    const r = await fetch(`${API}/api/verification/2fa/toggle`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      credentials: 'include',
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Impossible de modifier le statut 2FA' },
        { status: r.status }
      )
    }
    return NextResponse.json({
      ok: true,
      twoFactorEnabled: Boolean(data.twoFactorEnabled),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
