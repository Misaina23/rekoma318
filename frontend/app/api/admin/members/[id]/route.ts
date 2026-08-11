import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

type Member = {
  id: string
  firstName: string
  lastName: string
  sex: 'M' | 'F'
  role: string
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  joinedAt: string
  photo?: string
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const body = await req.json().catch(() => null)
  const list = await readJson<Member[]>('members.json', [])
  const idx = list.findIndex((m) => m.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
  list[idx] = {
    ...list[idx],
    ...body,
    firstName: String(body.firstName ?? list[idx].firstName).slice(0, 100),
    lastName: String(body.lastName ?? list[idx].lastName).slice(0, 100),
  }
  await writeJson('members.json', list)
  return NextResponse.json(list[idx])
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const list = await readJson<Member[]>('members.json', [])
  await writeJson(
    'members.json',
    list.filter((m) => m.id !== params.id)
  )
  return NextResponse.json({ ok: true })
}
