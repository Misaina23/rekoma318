import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

function buildHeaders(authHeader?: string) {
  return {
    'content-type': 'application/json',
    ...(authHeader ? { authorization: authHeader } : {}),
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  const body = await req.json().catch(() => null)
  try {
    const r = await fetch(`${API}/api/users/${params.id}`, {
      method: 'PUT',
      headers: buildHeaders(authHeader),
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
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  try {
    const r = await fetch(`${API}/api/users/${params.id}`, { method: 'DELETE', headers: buildHeaders(authHeader) })
    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return NextResponse.json({ message: data.error || 'Erreur lors de la suppression' }, { status: r.status })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  try {
    const r = await fetch(`${API}/api/users/${params.id}/reset-password`, { method: 'POST', headers: buildHeaders(authHeader) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return NextResponse.json({ message: data.error || 'Erreur' }, { status: r.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
