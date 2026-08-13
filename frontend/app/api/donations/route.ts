import { NextResponse, type NextRequest } from 'next/server'
import { remotePublic } from '@/lib/server/remote'

export async function GET() {
  try {
    const data = await remoteDonationsSafe()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ donations: [], totalCollected: 0 })
  }
}

async function remoteDonationsSafe() {
  const { remoteDonations } = await import('@/lib/server/remote')
  return remoteDonations.list()
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.donor || !body?.email || !body?.amount || !['stripe', 'mvola'].includes(body.method)) {
    return NextResponse.json({ message: 'Données de don invalides' }, { status: 400 })
  }
  try {
    const r = await remotePublic.postDonation({
      donor: body.donor,
      email: body.email,
      phone: body.phone,
      amount: body.amount,
      method: body.method,
    })
    return NextResponse.json({ ok: true, id: r.id, status: r.status })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
