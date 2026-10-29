import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import { FOUNDATIONAL_BUREAU } from '@/lib/foundational-members'
import crypto from 'crypto'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'

export const dynamic = 'force-dynamic'

function fullNameKey(m: any): string {
  return `${String(m?.firstName || '').trim()} ${String(m?.lastName || '').trim()}`.trim().toLowerCase()
}

let seedingPromise: Promise<any[]> | null = null
let memorySeededFlag = false
const SEED_MARKER_PATH = path.join(os.tmpdir(), 'rekoma_members_seeded.json')

async function isAlreadySeeded(): Promise<boolean> {
  if (memorySeededFlag) return true
  try {
    const raw = await fs.readFile(SEED_MARKER_PATH, 'utf-8')
    if (raw.trim() === 'true') {
      memorySeededFlag = true
      return true
    }
  } catch {
    // marker not present yet
  }
  return false
}

async function markAsSeeded(): Promise<void> {
  memorySeededFlag = true
  try {
    await fs.writeFile(SEED_MARKER_PATH, 'true', 'utf-8')
  } catch {
    // ignore read-only / tmp write errors
  }
}

async function seedRemoteFoundationalMembers(authHeader?: string | null): Promise<any[]> {
  if (seedingPromise) return seedingPromise
  seedingPromise = (async () => {
    const createdItems: any[] = []
    for (const member of FOUNDATIONAL_BUREAU) {
      try {
        const res = await remoteMembers.create(
          {
            ...member,
            joinedAt: new Date().toISOString(),
          },
          authHeader
        )
        const item = res?.item || res
        if (item?.id) createdItems.push(item)
      } catch (err: any) {
        console.warn('Failed to seed foundational member:', member.lastName, err?.message)
      }
    }
    if (createdItems.length > 0) {
      await markAsSeeded()
    }
    return createdItems
  })().finally(() => {
    seedingPromise = null
  })
  return seedingPromise
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_members')
  if (res) return res

  const q = req.nextUrl.searchParams.get('q') || undefined
  let local = await readJson<any[]>('members.json', [])
  const alreadySeeded = await isAlreadySeeded()

  try {
    let remoteData = await remoteMembers.list(q, authHeader)
    if (Array.isArray(remoteData)) {
      if (!q && remoteData.length === 0 && !alreadySeeded) {
        const seeded = await seedRemoteFoundationalMembers(authHeader)
        if (seeded.length > 0) {
          remoteData = seeded
        }
      } else if (remoteData.length > 0 && !alreadySeeded) {
        await markAsSeeded()
      }

      const mergedMap = new Map<string, any>()
      const seenNames = new Set<string>()
      for (const m of remoteData) {
        if (m?.id && !m.deletedAt) {
          mergedMap.set(m.id, m)
          const nk = fullNameKey(m)
          if (nk) seenNames.add(nk)
        }
      }
      for (const m of local) {
        if (m?.id && !m.deletedAt && !mergedMap.has(m.id)) {
          const nk = fullNameKey(m)
          if (!nk || !seenNames.has(nk)) {
            mergedMap.set(m.id, m)
            if (nk) seenNames.add(nk)
          }
        }
      }

      const list = Array.from(mergedMap.values()).sort(
        (a, b) =>
          (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999) ||
          String(a.lastName || '').localeCompare(String(b.lastName || ''))
      )
      return NextResponse.json(list, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      })
    }
  } catch (e: any) {
    console.warn('remoteMembers.list failed, reading from local store:', e.message)
  }

  if (local.length === 0 && !alreadySeeded) {
    local = FOUNDATIONAL_BUREAU.map((b, idx) => ({
      ...b,
      id: `gov-${idx + 1}`,
      joinedAt: new Date().toISOString(),
    }))
    await markAsSeeded()
  }

  const activeOrInactive = local.filter((m) => !m?.deletedAt)
  const term = q?.trim().toLowerCase()
  const filtered = term
    ? activeOrInactive.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.email || ''} ${m.role || ''} ${m.designation || ''}`
          .toLowerCase()
          .includes(term)
      )
    : activeOrInactive
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
    // Ensure foundational bureau is persisted in PostgreSQL before adding a new member
    // so adding a 10th member never hides the initial 9 governance members
    const alreadySeeded = await readJson<boolean>('members_seeded.json', false)
    if (!alreadySeeded) {
      const existingRemote = await remoteMembers.list(undefined, authHeader).catch(() => null)
      if (Array.isArray(existingRemote) && existingRemote.length === 0) {
        await seedRemoteFoundationalMembers(authHeader)
      } else if (Array.isArray(existingRemote) && existingRemote.length > 0) {
        await writeJson('members_seeded.json', true)
      }
    }

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
