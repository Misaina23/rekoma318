import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { readJson } from '@/lib/server/store'

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const visits = await readJson<{ total: number; days: Record<string, number> }>('visits.json', {
    total: 0,
    days: {},
  })
  const messages = await readJson<{ id: string; read: boolean; archived?: boolean }[]>('messages.json', [])
  const members = await readJson<{ id: string; status?: string }[]>('members.json', [])
  const activities = await readJson<{ id: string; status?: string }[]>('activities.json', [])
  const formations = await readJson<{ id: string }[]>('formations.json', [])
  const donations = await readJson<{ id: string; amount: number; status: string }[]>('donations.json', [])
  const day = new Date().toISOString().slice(0, 10)
  return NextResponse.json({
    role: session.role,
    visitors: visits.total,
    visitorsToday: visits.days[day] || 0,
    messages: messages.length,
    unread: messages.filter((m) => !m.read && !m.archived).length,
    members: members.length,
    activeMembers: members.filter((m) => m.status !== 'inactive').length,
    activities: activities.length,
    formations: formations.length,
    donations: donations.length,
    donationsCollected: donations.filter((d) => d.status === 'validated').reduce((s, d) => s + d.amount, 0),
  })
}
