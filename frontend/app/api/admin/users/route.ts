import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

function authHeaders(req: NextRequest) {
  const token = req.cookies.get('rekoma_access_token')?.value
  return {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_roles')
  if (res) return res
  const subtype = req.nextUrl.searchParams.get('type')
  const path = subtype === 'members' ? '/api/users/members' : '/api/users'
  try {
    const r = await fetch(`${API}${path}`, { headers: authHeaders(req), cache: 'no-store' })
    const data = await r.json().catch(() => [])
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_roles')
  if (res) return res
  const body = await req.json().catch(() => null)
  try {
    const r = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: authHeaders(req),
      body: JSON.stringify(body),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Erreur' }, { status: r.status })
    return NextResponse.json(data, { status: r.status })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
