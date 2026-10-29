import { NextResponse, type NextRequest } from 'next/server'
import { remoteStore } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données de commande invalides.' }, { status: 400 })

  let createdOrder: any = null

  try {
    const remoteData = await remoteStore.createOrder(body)
    if (remoteData?.order) {
      createdOrder = remoteData.order
    } else if (remoteData?.id) {
      createdOrder = remoteData
    }
  } catch (error) {
    console.warn('Backend order store unavailable, generating direct order ticket:', error)
  }

  if (!createdOrder) {
    const orderId = `CMD-${Date.now().toString().slice(-6)}`
    const total = Array.isArray(body.items)
      ? body.items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice || it.price || 0) * (it.quantity || 1)), 0)
      : 0
    createdOrder = {
      id: orderId,
      total: total || 0,
      customerName: body.customerName,
      phone: body.phone,
      city: body.city,
      deliveryType: body.deliveryType,
      address: body.address || null,
      note: body.note || null,
      items: body.items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  }

  // Persist into local orders store so orders are permanently visible in admin
  try {
    const currentOrders = await readJson<any[]>('orders.json', [])
    const filtered = currentOrders.filter((o) => o.id !== createdOrder.id)
    await writeJson('orders.json', [createdOrder, ...filtered])
  } catch (err: any) {
    console.warn('Failed to write to local orders.json:', err.message)
  }

  return NextResponse.json({ success: true, order: createdOrder }, { status: 201 })
}
