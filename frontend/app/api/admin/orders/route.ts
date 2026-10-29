import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import { readJson } from '@/lib/server/store'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_orders')
  if (res) return res

  const token = req.cookies.get('rekoma_access_token')?.value ||
                req.cookies.get('rekoma_admin')?.value ||
                req.headers.get('authorization')?.replace('Bearer ', '').trim()

  const localOrders = await readJson<any[]>('orders.json', [])
  let remoteOrders: any[] = []

  try {
    const data = await remoteStore.orders(token ? `Bearer ${token}` : undefined)
    if (data && Array.isArray(data.orders)) {
      remoteOrders = data.orders
    }
  } catch (error: any) {
    console.warn('remoteStore.orders failed, falling back to local orders:', error.message)
  }

  // Merge remote and local orders without duplicates by ID
  const orderMap = new Map<string, any>()
  for (const o of remoteOrders) {
    if (o?.id) orderMap.set(o.id, o)
  }
  for (const o of localOrders) {
    if (o?.id && !orderMap.has(o.id)) {
      orderMap.set(o.id, o)
    }
  }

  const merged = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )

  return NextResponse.json({ orders: merged })
}
