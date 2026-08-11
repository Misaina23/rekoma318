import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson } from '@/lib/server/store'

type Donation = {
  id: string
  donor: string
  email: string
  phone?: string
  amount: number
  method: 'stripe' | 'mvola'
  status: 'pending' | 'validated' | 'refused'
  createdAt: string
}

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_donations')
  if (res) return res
  const list = await readJson<Donation[]>('donations.json', [])
  const total = list.reduce((s, d) => s + (d.status === 'validated' ? d.amount : 0), 0)
  return NextResponse.json({ donations: list, totalCollected: total })
}
