import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données d’article invalides.' }, { status: 400 })
  try {
    return NextResponse.json(await remoteStore.updateProduct(params.id, body, authHeader))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Modification impossible.'
    return NextResponse.json({ message }, { status })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  try {
    return NextResponse.json(await remoteStore.updateProduct(params.id, { active: false, published: false }, authHeader))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Suppression impossible.'
    return NextResponse.json({ message }, { status })
  }
}
