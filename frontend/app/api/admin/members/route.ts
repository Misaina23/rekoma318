import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import crypto from 'crypto'

function getAuthHeader(req: NextRequest): string | undefined {
  const token = req.cookies.get('rekoma_access_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '').trim()
  return token ? `Bearer ${token}` : undefined
}

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const authHeader = getAuthHeader(req)
  const q = req.nextUrl.searchParams.get('q') || undefined
  try {
    const remoteData = await remoteMembers.list(q, authHeader)
    if (Array.isArray(remoteData) && remoteData.length > 0) {
      return NextResponse.json(remoteData)
    }
  } catch (e: any) {
    console.warn('remoteMembers.list failed, reading from local store:', e.message)
  }

  const local = await readJson<any[]>('members.json', [])
  const term = q?.trim().toLowerCase()
  const filtered = term
    ? local.filter((m) => `${m.firstName} ${m.lastName} ${m.email || ''} ${m.role || ''}`.toLowerCase().includes(term))
    : local
  return NextResponse.json(filtered)
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res

  const authHeader = getAuthHeader(req)
  const body = await req.json().catch(() => null)

  const firstName = String(body?.firstName || '').trim()
  const lastName = String(body?.lastName || '').trim()

  if (!firstName || !lastName) {
    return NextResponse.json({ message: 'Le nom et le prénom sont obligatoires.' }, { status: 400 })
  }

  // Sanitize and normalize fields
  const cleanMember = {
    firstName: firstName.slice(0, 100),
    lastName: lastName.slice(0, 100),
    sex: body?.sex === 'F' ? 'F' : 'M',
    role: String(body?.role || '').trim().slice(0, 150),
    displayOrder: Number(body?.displayOrder) || 999,
    description: String(body?.description || '').trim().slice(0, 1000),
    address: String(body?.address || '').trim().slice(0, 255),
    phone: String(body?.phone || '').trim().slice(0, 50),
    email: String(body?.email || '').trim().slice(0, 150),
    status: body?.status === 'inactive' ? 'inactive' : 'active',
    photo: String(body?.photo || '').trim(),
    joinedAt: new Date().toISOString(),
  }

  try {
    const item = await remoteMembers.create(cleanMember, authHeader)
    if (item && item.id) {
      const currentList = await readJson<any[]>('members.json', [])
      await writeJson('members.json', [item, ...currentList.filter((m) => m.id !== item.id)])
      return NextResponse.json(item, { status: 201 })
    }
  } catch (e: any) {
    console.warn('remoteMembers.create failed, falling back to local storage:', e.message)
  }

  // Local fallback storage
  const currentList = await readJson<any[]>('members.json', [])
  const localItem = {
    id: crypto.randomUUID(),
    ...cleanMember,
  }
  await writeJson('members.json', [localItem, ...currentList])
  return NextResponse.json(localItem, { status: 201 })
}
