import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { remoteMessages, remoteMembers, remoteActivities, remoteFormations, remoteDonations } from '@/lib/server/remote'
import { readFileSync } from 'fs'
import { join } from 'path'

function readLocalData<T>(filename: string, fallback: T): T {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', filename), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeArray<T>(data: T[] | { items?: T[] } | undefined): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as any).items)) return (data as any).items
  return []
}

function safeDonations(data: any): { donations: any[]; totalCollected: number } {
  if (data && Array.isArray(data.donations)) return data
  if (Array.isArray(data)) return { donations: data, totalCollected: 0 }
  return { donations: [], totalCollected: 0 }
}

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined

  const day = new Date().toISOString().slice(0, 10)

  try {
    const [threads, members, activities, formations, donations] = await Promise.all([
      remoteMessages.listThreads(authHeader).catch(() => null),
      remoteMembers.list(undefined, authHeader).catch(() => null),
      remoteActivities.list(authHeader).catch(() => null),
      remoteFormations.list(authHeader).catch(() => null),
      remoteDonations.list(undefined, authHeader).catch(() => null),
    ])

    const localMessages = readLocalData<any[]>('messages.json', [])
    const localMembers = readLocalData<any[]>('members.json', [])
    const localActivities = readLocalData<any[]>('activities.json', [])
    const localFormations = readLocalData<any[]>('formations.json', [])
    const localDonations = readLocalData<any[]>('donations.json', [])

    const msgs = threads ? safeArray(threads) : localMessages
    const allMessages = Array.isArray(msgs) ? msgs : []
    const membersList = members ? safeArray(members) : localMembers
    const activitiesList = activities ? safeArray(activities) : localActivities
    const formationsList = formations ? safeArray(formations) : localFormations
    const donationsData = donations ? safeDonations(donations) : { donations: localDonations, totalCollected: 0 }

    const localVisits = readLocalData<{ total: number; days?: Record<string, number> }>('visits.json', { total: 0 })
    const visitors = localVisits.total || 0
    const visitorsToday = (localVisits.days && localVisits.days[day]) || 0

    return NextResponse.json({
      role: session.role,
      visitors,
      visitorsToday,
      messages: allMessages.length,
      unread: allMessages.filter((m: any) => !m.read && !m.archived).length,
      members: membersList.length,
      activeMembers: membersList.filter((m: any) => m.status !== 'inactive').length,
      activities: activitiesList.length,
      formations: formationsList.length,
      donations: donationsData.donations.length,
      donationsCollected: donationsData.totalCollected || 0,
      day,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
