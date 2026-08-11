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

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  return NextResponse.json(await readJson<Member[]>('members.json', []))
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.firstName || !body?.lastName) {
    return NextResponse.json({ message: 'Nom et prénom requis' }, { status: 400 })
  }
  const list = await readJson<Member[]>('members.json', [])
  const member: Member = {
    id: crypto.randomUUID(),
    firstName: String(body.firstName).slice(0, 100),
    lastName: String(body.lastName).slice(0, 100),
    sex: body.sex === 'F' ? 'F' : 'M',
    role: String(body.role || '').slice(0, 120),
    address: String(body.address || '').slice(0, 300),
    phone: String(body.phone || '').slice(0, 40),
    email: String(body.email || '').slice(0, 200),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    joinedAt: new Date().toISOString(),
    photo: body.photo || '',
  }
  list.unshift(member)
  await writeJson('members.json', list)
  return NextResponse.json(member, { status: 201 })
}
