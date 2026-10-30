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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_orders')
  if (res) return res

  const orderId = params.id

  // Remove from local store and keep deleted list
  try {
    const local = await readJson<any[]>('orders.json', [])
    const updated = local.filter((o) => o.id !== orderId)
    await writeJson('orders.json', updated)

    const deletedList = await readJson<string[]>('deleted_orders.json', [])
    if (!deletedList.includes(orderId)) {
      deletedList.push(orderId)
      await writeJson('deleted_orders.json', deletedList)
    }
  } catch (err: any) {
    console.warn('Failed to delete from local store:', err.message)
  }

  // Remove from remote store if not a local-only mock ID
  if (!orderId.startsWith('CMD-')) {
    try {
      await remoteStore.deleteOrder(orderId, authHeader)
    } catch (err: any) {
      console.warn('remoteStore.deleteOrder error or fallback:', err?.message)
    }
  }

  return NextResponse.json({ success: true, id: orderId })
}
