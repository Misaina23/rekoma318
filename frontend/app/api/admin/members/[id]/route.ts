import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

function getAuthHeader(req: NextRequest): string | undefined {
  const token = req.cookies.get('rekoma_access_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '').trim()
  return token ? `Bearer ${token}` : undefined
}

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const authHeader = getAuthHeader(req)
  const body = await req.json().catch(() => null)
  let updatedItem = null
  try {
    updatedItem = await remoteMembers.update(params.id, body, authHeader)
  } catch (e: any) {
    console.warn('remoteMembers.update remote error:', e.message)
  }

  const list = await readJson<any[]>('members.json', [])
  const existing = list.find((m) => m.id === params.id)
  const merged = updatedItem || { ...(existing || {}), ...body, id: params.id }
  await writeJson('members.json', list.map((m) => (m.id === params.id ? merged : m)))
  return NextResponse.json(merged)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const authHeader = getAuthHeader(req)
  try {
    await remoteMembers.remove(params.id, authHeader)
  } catch (e: any) {
    console.warn('remoteMembers.remove remote error:', e.message)
  }
  const list = await readJson<any[]>('members.json', [])
  await writeJson('members.json', list.filter((m) => m.id !== params.id))
  return NextResponse.json({ ok: true })
}
