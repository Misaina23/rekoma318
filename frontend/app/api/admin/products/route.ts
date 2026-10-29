import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  try {
    return NextResponse.json(await remoteStore.adminProducts(authHeader))
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Articles indisponibles.'
    return NextResponse.json({ message }, { status })
  }
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données d’article invalides.' }, { status: 400 })
  try {
    return NextResponse.json(await remoteStore.createProduct(body, authHeader), { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Création impossible.'
    return NextResponse.json({ message }, { status })
  }
}
