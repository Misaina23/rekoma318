import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_members')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  const local = await readJson<any[]>('members.json', [])

  try {
    const remoteData = await remoteMembers.list(q, authHeader)
    if (Array.isArray(remoteData)) {
      const mergedMap = new Map<string, any>()
      for (const m of remoteData) {
        if (m?.id) mergedMap.set(m.id, m)
      }
      for (const m of local) {
        if (m?.id && !mergedMap.has(m.id)) mergedMap.set(m.id, m)
      }
      const list = Array.from(mergedMap.values()).sort(
        (a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999) || String(a.lastName || '').localeCompare(String(b.lastName || ''))
      )
      return NextResponse.json(list, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      })
    }
  } catch (e: any) {
    console.warn('remoteMembers.list failed, reading from local store:', e.message)
  }

  const term = q?.trim().toLowerCase()
  const filtered = term
    ? local.filter((m) => `${m.firstName} ${m.lastName} ${m.email || ''} ${m.role || ''} ${m.designation || ''}`.toLowerCase().includes(term))
    : local
  return NextResponse.json(filtered, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_members')
  if (res) return res

  const body = await req.json().catch(() => null)

  const firstName = String(body?.firstName || '').trim()
  const lastName = String(body?.lastName || '').trim()

  if (!firstName || !lastName) {
    return NextResponse.json({ message: 'Le nom et le prénom sont obligatoires.' }, { status: 400 })
  }

  const parsedOrder = Number(body?.displayOrder)
  const cleanMember = {
    firstName: firstName.slice(0, 100),
    lastName: lastName.slice(0, 100),
    sex: body?.sex === 'F' ? 'F' : 'M',
    role: String(body?.role || '').trim().slice(0, 150),
    designation: String(body?.designation || '').trim().slice(0, 150),
    displayOrder: Number.isFinite(parsedOrder) && parsedOrder > 0 ? parsedOrder : 999,
    description: String(body?.description || '').trim().slice(0, 1000),
    address: String(body?.address || '').trim().slice(0, 255),
    phone: String(body?.phone || '').trim().slice(0, 50),
    email: String(body?.email || '').trim().slice(0, 150),
    status: body?.status === 'inactive' ? 'inactive' : 'active',
    photo: String(body?.photo || '').trim().slice(0, 500),
    joinedAt: new Date().toISOString(),
  }

  try {
    const created = await remoteMembers.create(cleanMember, authHeader)
    const item = created?.item || created
    if (item && item.id) {
      const currentList = await readJson<any[]>('members.json', [])
      await writeJson('members.json', [item, ...currentList.filter((m) => m.id !== item.id)])
      revalidatePath('/gouvernance')
      revalidatePath('/api/members/public')
      return NextResponse.json(item, { status: 201 })
    }
  } catch (e: any) {
    const status = Number(e?.status) || 0
    if (status >= 400) {
      return NextResponse.json(
        { message: e.message || 'Impossible d’enregistrer le membre en base de données.' },
        { status }
      )
    }
    console.warn('remoteMembers.create unreachable, falling back to local storage:', e.message)
  }

  // Offline local fallback storage when backend is unreachable
  const currentList = await readJson<any[]>('members.json', [])
  const localItem = {
    id: crypto.randomUUID(),
    ...cleanMember,
  }
  await writeJson('members.json', [localItem, ...currentList])
  revalidatePath('/gouvernance')
  revalidatePath('/api/members/public')
  return NextResponse.json(localItem, { status: 201 })
}
