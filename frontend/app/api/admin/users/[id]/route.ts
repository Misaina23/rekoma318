import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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
    if (r.ok) {
      // update local cache as well
      const localUsers = await readJson<any[]>('users.json', [])
      const updated = localUsers.map((u: any) => (u.id === params.id ? { ...u, ...body } : u))
      await writeJson('users.json', updated)
      return NextResponse.json(data)
    }
  } catch {}

  // Local fallback update
  const localUsers = await readJson<any[]>('users.json', [])
  const target = localUsers.find((u: any) => u.id === params.id)
  if (!target) {
    return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
  }
  const updatedUser = { ...target, ...body }
  const updated = localUsers.map((u: any) => (u.id === params.id ? updatedUser : u))
  await writeJson('users.json', updated)
  return NextResponse.json({ success: true, user: updatedUser })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  try {
    const r = await fetch(`${API}/api/users/${params.id}`, { method: 'DELETE', headers: buildHeaders(authHeader) })
    if (r.ok) {
      const localUsers = await readJson<any[]>('users.json', [])
      await writeJson('users.json', localUsers.filter((u: any) => u.id !== params.id))
      return NextResponse.json({ ok: true })
    }
  } catch {}

  const localUsers = await readJson<any[]>('users.json', [])
  await writeJson('users.json', localUsers.filter((u: any) => u.id !== params.id))
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  const newPass = `Rekoma#${crypto.randomInt(1000, 9999)}`
  try {
    const r = await fetch(`${API}/api/users/${params.id}/reset-password`, { method: 'POST', headers: buildHeaders(authHeader) })
    const data = await r.json().catch(() => ({}))
    if (r.ok) return NextResponse.json(data)
  } catch {}

  return NextResponse.json({
    success: true,
    temporaryPassword: newPass,
    message: 'Nouveau mot de passe temporaire généré.',
  })
}
