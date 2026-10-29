import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_orders')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body || typeof body.status !== 'string') {
    return NextResponse.json({ message: 'Statut de commande invalide.' }, { status: 400 })
  }

  // Update in local store if present
  try {
    const local = await readJson<any[]>('orders.json', [])
    if (local.some((o) => o.id === params.id)) {
      const updated = local.map((o) => (o.id === params.id ? { ...o, status: body.status } : o))
      await writeJson('orders.json', updated)
    }
  } catch (err: any) {
    console.warn('Failed to update local order:', err.message)
  }

  if (params.id.startsWith('CMD-')) {
    return NextResponse.json({ success: true, id: params.id, status: body.status })
  }

  try {
    const remoteData = await remoteStore.updateOrder(params.id, body.status, authHeader)
    return NextResponse.json(remoteData)
  } catch (error: any) {
    const status = Number(error?.status) || 502
    return NextResponse.json(
      { message: error?.message || 'Impossible de modifier le statut de la commande.' },
      { status }
    )
  }
}
