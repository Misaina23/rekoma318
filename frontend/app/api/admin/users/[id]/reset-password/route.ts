import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res

  try {
    const r = await fetch(`${API}/api/users/${params.id}/reset-password`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: 'no-store',
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      return NextResponse.json(
        { message: data.error || data.message || 'Impossible de réinitialiser le mot de passe' },
        { status: r.status }
      )
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
