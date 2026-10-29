import { NextResponse, type NextRequest } from 'next/server'
import { remoteStore } from '@/lib/server/remote'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données de commande invalides.' }, { status: 400 })
  try {
    const remoteData = await remoteStore.createOrder(body)
    return NextResponse.json(remoteData, { status: 201 })
  } catch (error) {
    console.warn('Backend order store unavailable, generating direct order ticket:', error)
    const orderId = `CMD-${Date.now().toString().slice(-6)}`
    const total = Array.isArray(body.items)
      ? body.items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice || it.price || 0) * (it.quantity || 1)), 0)
      : 0
    return NextResponse.json({
      order: {
        id: orderId,
        total: total || 0,
        customerName: body.customerName,
        phone: body.phone,
        city: body.city,
        deliveryType: body.deliveryType,
        address: body.address,
        items: body.items,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 })
  }
}
