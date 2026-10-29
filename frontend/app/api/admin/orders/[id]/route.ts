import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_orders')
  if (res) return res

  const token = req.cookies.get('rekoma_access_token')?.value ||
                req.cookies.get('rekoma_admin')?.value ||
                req.headers.get('authorization')?.replace('Bearer ', '').trim()

  const body = await req.json().catch(() => null)
  if (!body || typeof body.status !== 'string') {
    return NextResponse.json({ message: 'Statut de commande invalide.' }, { status: 400 })
  }

  // Update in local store
  try {
    const local = await readJson<any[]>('orders.json', [])
    const updated = local.map((o) => (o.id === params.id ? { ...o, status: body.status } : o))
    await writeJson('orders.json', updated)
  } catch (err: any) {
    console.warn('Failed to update local order:', err.message)
  }

  try {
    const remoteData = await remoteStore.updateOrder(params.id, body.status, token ? `Bearer ${token}` : undefined)
    return NextResponse.json(remoteData)
  } catch (error) {
    console.warn('remoteStore.updateOrder failed, returning local update status')
    return NextResponse.json({ success: true, id: params.id, status: body.status })
  }
}
