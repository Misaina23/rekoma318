import { NextResponse, type NextRequest } from 'next/server'
import { remoteStore } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données de commande invalides.' }, { status: 400 })
  try {
    return NextResponse.json(await remoteStore.createOrder(body), { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    if (status >= 500) console.error('Unable to save public store order:', error)
    const message = status < 500 && error instanceof Error
      ? error.message
      : 'Impossible d’enregistrer la demande pour le moment. Réessayez plus tard.'
    return NextResponse.json({ message }, { status })
  }
}
