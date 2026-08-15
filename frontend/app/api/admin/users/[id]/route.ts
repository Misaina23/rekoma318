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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_roles')
  if (res) return res
  const body = await req.json().catch(() => null)
  try {
    const r = await fetch(`${API}/api/users/${params.id}`, {
      method: 'PUT',
      headers: authHeaders(req),
      body: JSON.stringify(body),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Erreur' }, { status: r.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_roles')
  if (res) return res
  try {
    await fetch(`${API}/api/users/${params.id}`, { method: 'DELETE', headers: authHeaders(req) })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_roles')
  if (res) return res
  try {
    const r = await fetch(`${API}/api/users/${params.id}/reset-password`, { method: 'POST', headers: authHeaders(req) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Erreur' }, { status: r.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
