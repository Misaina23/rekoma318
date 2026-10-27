import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_products')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  try {
    return NextResponse.json(await remoteStore.adminProducts(token ? `Bearer ${token}` : undefined))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Articles indisponibles.'
    return NextResponse.json({ message }, { status })
  }
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_products')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données d’article invalides.' }, { status: 400 })
  try {
    return NextResponse.json(await remoteStore.createProduct(body, token ? `Bearer ${token}` : undefined), { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Création impossible.'
    return NextResponse.json({ message }, { status })
  }
}
