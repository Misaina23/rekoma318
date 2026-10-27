import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_products')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données d’article invalides.' }, { status: 400 })
  try {
    return NextResponse.json(await remoteStore.updateProduct(params.id, body, token ? `Bearer ${token}` : undefined))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Modification impossible.'
    return NextResponse.json({ message }, { status })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_products')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  try {
    return NextResponse.json(await remoteStore.updateProduct(params.id, { active: false, published: false }, token ? `Bearer ${token}` : undefined))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Suppression impossible.'
    return NextResponse.json({ message }, { status })
  }
}
