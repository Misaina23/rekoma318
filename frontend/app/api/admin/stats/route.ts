import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { remoteMessages, remoteMembers, remoteActivities, remoteFormations, remoteDonations } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

  const day = new Date().toISOString().slice(0, 10)

  try {
    const [threads, members, activities, formations, donations] = await Promise.all([
      remoteMessages.listThreads().catch(() => []),
      remoteMembers.list().catch(() => []),
      remoteActivities.list().catch(() => []),
      remoteFormations.list().catch(() => []),
      remoteDonations.list().catch(() => ({ donations: [], totalCollected: 0 })),
    ])

    const allMessages = threads.flatMap((t: any) => t.messages || [])
    return NextResponse.json({
      role: session.role,
      visitors: 0,
      visitorsToday: 0,
      messages: allMessages.length,
      unread: allMessages.filter((m: any) => !m.read && !m.archived).length,
      members: members.length,
      activeMembers: members.filter((m: any) => m.status !== 'inactive').length,
      activities: activities.length,
      formations: formations.length,
      donations: donations.donations?.length || 0,
      donationsCollected: donations.totalCollected || 0,
      day,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
