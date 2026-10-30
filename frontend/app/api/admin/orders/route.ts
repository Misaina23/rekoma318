import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_orders')
  if (res) return res

  const localOrders = await readJson<any[]>('orders.json', [])
  let remoteOrders: any[] = []

  try {
    const data = await remoteStore.orders(authHeader)
    if (data && Array.isArray(data.orders)) {
      remoteOrders = data.orders
    }
  } catch (error: any) {
    const status = Number(error?.status) || 0
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { message: error?.message || 'Accès refusé aux commandes sur le serveur.' },
        { status }
      )
    }
    console.warn('remoteStore.orders failed, falling back to local orders:', error.message)
  }

  const deletedOrders = await readJson<string[]>('deleted_orders.json', [])
  const deletedSet = new Set(deletedOrders)

  // Merge remote and local orders without duplicates by ID, filtering deleted
  const orderMap = new Map<string, any>()
  for (const o of remoteOrders) {
    if (o?.id && !deletedSet.has(o.id)) orderMap.set(o.id, o)
  }
  for (const o of localOrders) {
    if (o?.id && !deletedSet.has(o.id) && !orderMap.has(o.id)) {
      orderMap.set(o.id, o)
    }
  }

  const merged = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )

  return NextResponse.json(
    { orders: merged },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}
