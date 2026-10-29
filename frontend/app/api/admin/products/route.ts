import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import {
  encodeProductSlug,
  isDeletedProductSlug,
  normalizeProductRecord,
} from '@/lib/server/productsCatalog'

export const dynamic = 'force-dynamic'

function parsePrice(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  const cleaned = String(raw).replace(/\s+/g, '').replace(',', '.')
  const num = Number(cleaned)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num)
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  try {
    const data = await remoteStore.adminProducts(authHeader)
    const rawItems = Array.isArray(data?.items) ? data.items : []
    const items = rawItems
      .filter((item: any) => item && !isDeletedProductSlug(item.slug))
      .map((item: any) => normalizeProductRecord(item))

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
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
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ message: 'Le nom de l’article est requis.' }, { status: 400 })
  }

  const price = parsePrice(body.price)
  if (price === null) {
    return NextResponse.json({ message: 'Le prix doit être un montant valide (≥ 0 Ar).' }, { status: 400 })
  }

  const name = body.name.trim().slice(0, 200)
  const category = typeof body.category === 'string' ? body.category.trim() : 'Vêtements'
  let slug = encodeProductSlug(body.slug || name, category)

  try {
    const existingData = await remoteStore.adminProducts(authHeader).catch(() => ({ items: [] }))
    const existingSlugs = new Set(
      (Array.isArray(existingData?.items) ? existingData.items : []).map((p: any) => String(p?.slug || ''))
    )
    if (existingSlugs.has(slug)) {
      slug = `${slug.slice(0, 155)}-${Date.now().toString(36)}`
    }

    const sizes = Array.isArray(body.sizes)
      ? body.sizes.map((s: unknown) => String(s).trim()).filter(Boolean)
      : typeof body.sizes === 'string'
        ? body.sizes
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

    const payload = {
      name,
      slug,
      price,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '',
      imageUrl: typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim().slice(0, 500) : null,
      sizes,
      published: body.published !== false,
      active: body.active !== false,
    }

    const created = await remoteStore.createProduct(payload, authHeader)
    return NextResponse.json({ item: normalizeProductRecord(created) }, { status: 201 })
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Création impossible.'
    return NextResponse.json({ message }, { status })
  }
}
