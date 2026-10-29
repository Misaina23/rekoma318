import { NextResponse, type NextRequest } from 'next/server'
import { remoteStore } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

const KNOWN_DEFAULT_PRODUCT_IDS = new Set([
  'store-teddy',
  'store-hoodie',
  'store-doudoune',
  'store-polo',
  'store-tee',
  'store-oversize',
  'store-salova',
  'store-cap',
  'store-tank',
  'store-peluche',
])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ message: 'Votre panier est vide ou les données de commande sont invalides.' }, { status: 400 })
  }

  const normalizedPayload = {
    customerName: typeof body.customerName === 'string' ? body.customerName.trim() : '',
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    city: typeof body.city === 'string' ? body.city.trim() : '',
    deliveryType: body.deliveryType === 'delivery' ? 'delivery' : 'pickup',
    address: typeof body.address === 'string' ? body.address.trim() : '',
    note: typeof body.note === 'string' ? body.note.trim() : '',
    items: body.items.map((it: any) => ({
      productId: typeof it?.productId === 'string' ? it.productId.trim() : '',
      name: it?.name || '',
      unitPrice: Number(it?.unitPrice || it?.price || 0),
      quantity: Math.trunc(Number(it?.quantity) || 0),
      size: typeof it?.size === 'string' ? it.size.trim() : '',
    })),
  }

  if (!normalizedPayload.customerName || normalizedPayload.phone.length < 6 || !normalizedPayload.city) {
    return NextResponse.json({ message: 'Nom, téléphone et ville sont obligatoires.' }, { status: 400 })
  }

  if (normalizedPayload.deliveryType === 'delivery' && !normalizedPayload.address) {
    return NextResponse.json({ message: 'Veuillez renseigner une adresse de livraison.' }, { status: 400 })
  }

  for (const item of normalizedPayload.items) {
    if (!item.productId || item.quantity < 1 || item.quantity > 10) {
      return NextResponse.json({ message: 'Un article ou une quantité du panier est invalide.' }, { status: 400 })
    }
  }

  let createdOrder: any = null

  try {
    const remoteData = await remoteStore.createOrder(normalizedPayload)
    if (remoteData?.order) {
      createdOrder = remoteData.order
    } else if (remoteData?.id) {
      createdOrder = remoteData
    }
  } catch (error: any) {
    const status = Number(error?.status) || 0

    // Reconcile against live backend catalogue if initial StoreProduct migration had empty sizes=[] or missing default items
    if (status === 400) {
      try {
        const liveCat = await remoteStore.products()
        const liveItems = Array.isArray(liveCat?.items) ? liveCat.items : []
        if (liveItems.length > 0) {
          const sizeNotes: string[] = []
          let allExistInLiveDb = true
          const reconciledItems = normalizedPayload.items.map((it: any) => {
            const matched = liveItems.find(
              (p: any) => p.id === it.productId || p.slug === it.productId || p.name?.toLowerCase() === it.name?.toLowerCase()
            )
            if (!matched) {
              allExistInLiveDb = false
              return it
            }
            const dbSizes: string[] = Array.isArray(matched.sizes) ? matched.sizes : []
            if (dbSizes.length === 0 && it.size) {
              sizeNotes.push(`${matched.name}: ${it.size}`)
              return { ...it, productId: matched.id, size: '' }
            }
            if (dbSizes.length > 0) {
              const foundSize = dbSizes.find((s) => s.toLowerCase() === String(it.size || '').toLowerCase()) || dbSizes[0]
              return { ...it, productId: matched.id, size: foundSize }
            }
            return { ...it, productId: matched.id }
          })

          if (allExistInLiveDb) {
            const extraNote = sizeNotes.length > 0 ? `[Tailles: ${sizeNotes.join(', ')}]` : ''
            const retryPayload = {
              ...normalizedPayload,
              note: [normalizedPayload.note, extraNote].filter(Boolean).join(' ').trim(),
              items: reconciledItems,
            }
            const retryData = await remoteStore.createOrder(retryPayload)
            if (retryData?.order) {
              createdOrder = retryData.order
            } else if (retryData?.id) {
              createdOrder = retryData
            }
          }
        }
      } catch {
        // Proceed to check known default items below
      }
    }

    const allKnownCatalogueItems = normalizedPayload.items.every((it: any) => KNOWN_DEFAULT_PRODUCT_IDS.has(it.productId))
    if (!createdOrder && status >= 400 && status < 500 && !allKnownCatalogueItems) {
      return NextResponse.json(
        { message: error?.message || 'Commande invalide. Veuillez vérifier les articles sélectionnés.' },
        { status }
      )
    }

    if (!createdOrder) {
      console.warn('Backend order store unavailable or unseeded item, persisting local fallback order:', error?.message)
    }
  }

  if (!createdOrder) {
    const orderId = `CMD-${Date.now().toString().slice(-6)}`
    const total = normalizedPayload.items.reduce(
      (sum: number, it: any) => sum + Number(it.unitPrice || 0) * Number(it.quantity || 1),
      0
    )
    createdOrder = {
      id: orderId,
      total: total || 0,
      customerName: normalizedPayload.customerName,
      phone: normalizedPayload.phone,
      city: normalizedPayload.city,
      deliveryType: normalizedPayload.deliveryType,
      address: normalizedPayload.address || null,
      note: normalizedPayload.note || null,
      items: normalizedPayload.items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  }

  try {
    const currentOrders = await readJson<any[]>('orders.json', [])
    const filtered = currentOrders.filter((o) => o.id !== createdOrder.id)
    await writeJson('orders.json', [createdOrder, ...filtered])
  } catch (err: any) {
    console.warn('Failed to write to local orders.json:', err.message)
  }

  return NextResponse.json({ success: true, order: createdOrder }, { status: 201 })
}
