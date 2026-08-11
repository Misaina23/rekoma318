import { NextResponse, type NextRequest } from 'next/server'
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
  note?: string
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.donor || !body?.email || !body?.amount || !['stripe', 'mvola'].includes(body.method)) {
    return NextResponse.json({ message: 'Données de don invalides' }, { status: 400 })
  }
  const list = await readJson<Donation[]>('donations.json', [])
  const donation: Donation = {
    id: crypto.randomUUID(),
    donor: String(body.donor).slice(0, 120),
    email: String(body.email).slice(0, 200),
    phone: body.phone ? String(body.phone).slice(0, 40) : '',
    amount: Number(body.amount) || 0,
    method: body.method,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  list.unshift(donation)
  await writeJson('donations.json', list)
  // Stripe / MVola integration hooks would confirm the payment here.
  return NextResponse.json({ ok: true, id: donation.id, status: donation.status })
}
