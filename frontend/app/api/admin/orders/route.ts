import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_orders')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  try {
    return NextResponse.json(await remoteStore.orders(token ? `Bearer ${token}` : undefined))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Commandes indisponibles.'
    return NextResponse.json({ message }, { status })
  }
}
