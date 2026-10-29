import { NextResponse } from 'next/server'
import { remoteMembers } from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'
import { FOUNDATIONAL_BUREAU } from '@/lib/foundational-members'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fullNameKey(m: any): string {
  return `${String(m?.firstName || '').trim()} ${String(m?.lastName || '').trim()}`.trim().toLowerCase()
}

export async function GET() {
  const memberMap = new Map<string, any>()
  const seenNames = new Set<string>()
  let remoteSucceeded = false

  // 1. Fetch remote members from backend PostgreSQL
  try {
    const remoteData = await remoteMembers.public()
    if (Array.isArray(remoteData)) {
      remoteSucceeded = true
      for (const m of remoteData) {
        if (m && m.id && m.status !== 'inactive' && !m.deletedAt) {
          memberMap.set(m.id, m)
          const nk = fullNameKey(m)
          if (nk) seenNames.add(nk)
        }
      }
    }
  } catch (e: any) {
    console.warn('remoteMembers.public failed, reading local cache:', e.message)
  }

  // 2. Merge local members created in offline fallback (members.json)
  try {
    const local = await readJson<any[]>('members.json', [])
    for (const m of local) {
      if (m && m.id && m.status !== 'inactive' && !m.deletedAt) {
        const nk = fullNameKey(m)
        if (!memberMap.has(m.id) && (!nk || !seenNames.has(nk))) {
          // Only include local cache items if backend failed OR item is local-only UUID not superseded
          if (!remoteSucceeded || String(m.id).startsWith('local-')) {
            memberMap.set(m.id, m)
            if (nk) seenNames.add(nk)
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('Error reading local members.json:', err.message)
  }

  // 3. Only fall back to FOUNDATIONAL_BUREAU if DB has never been seeded yet
  const alreadySeeded = await readJson<boolean>('members_seeded.json', false)
  if (memberMap.size === 0 && !alreadySeeded) {
    FOUNDATIONAL_BUREAU.forEach((b, idx) => {
      memberMap.set(`gov-${idx + 1}`, { id: `gov-${idx + 1}`, ...b })
    })
  }

  const result = Array.from(memberMap.values()).sort(
    (a, b) =>
      (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999) ||
      String(a.lastName || '').localeCompare(String(b.lastName || ''))
  )

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
