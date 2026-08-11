import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_donations')
  if (res) return res
  const body = await req.json().catch(() => null)
  const list = await readJson<Donation[]>('donations.json', [])
  const idx = list.findIndex((d) => d.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
  list[idx] = {
    ...list[idx],
    status: ['pending', 'validated', 'refused'].includes(body.status) ? body.status : list[idx].status,
  }
  await writeJson('donations.json', list)
  return NextResponse.json(list[idx])
}
