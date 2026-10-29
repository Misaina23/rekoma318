import { NextResponse } from 'next/server'
import { remotePublic } from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await remotePublic.publicStats()
    return NextResponse.json({
      activeMembers: data.activeMembers,
      formations: data.formations,
      validatedDonations: data.validatedDonations,
    })
  } catch {
    const [members, formations, donations] = await Promise.all([
      readJson<any[]>('members.json', []),
      readJson<any[]>('formations.json', []),
      readJson<any[]>('donations.json', []),
    ])
    return NextResponse.json({
      activeMembers: members.filter((m) => m?.status !== 'inactive').length || 9,
      formations: formations.length,
      validatedDonations: donations.filter((d) => d?.status === 'validated').length,
    })
  }
}
