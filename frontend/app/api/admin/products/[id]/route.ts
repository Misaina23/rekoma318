import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteStore } from '@/lib/server/remote'
import {
  decodeProductSlug,
  encodeProductSlug,
  findDefaultProduct,
  normalizeProductRecord,
  slugifyText,
} from '@/lib/server/productsCatalog'

export const dynamic = 'force-dynamic'

function parsePrice(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  const cleaned = String(raw).replace(/\s+/g, '').replace(',', '.')
  const num = Number(cleaned)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num)
}

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Données d’article invalides.' }, { status: 400 })
  }

  const payload: Record<string, any> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ message: 'Le nom de l’article est requis.' }, { status: 400 })
    }
    payload.name = body.name.trim().slice(0, 200)
  }

  if (body.price !== undefined) {
    const price = parsePrice(body.price)
    if (price === null) {
      return NextResponse.json({ message: 'Le prix doit être un montant valide (≥ 0 Ar).' }, { status: 400 })
    }
    payload.price = price
  }

  if (body.description !== undefined) {
    payload.description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : ''
  }

  if (body.imageUrl !== undefined) {
    payload.imageUrl =
      typeof body.imageUrl === 'string' && body.imageUrl.trim()
        ? body.imageUrl.trim().slice(0, 500)
        : null
  }

  if (body.sizes !== undefined) {
    payload.sizes = Array.isArray(body.sizes)
      ? body.sizes.map((s: unknown) => String(s).trim()).filter(Boolean)
      : typeof body.sizes === 'string'
        ? body.sizes
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []
  }

  if (body.published !== undefined) {
    payload.published = Boolean(body.published)
  }

  if (body.active !== undefined) {
    payload.active = Boolean(body.active)
  }

  try {
    let targetId = params.id
    let currentRecord: any = null

    if (body.category !== undefined) {
      const existingData = await remoteStore.adminProducts(authHeader).catch(() => ({ items: [] }))
      const existingList = Array.isArray(existingData?.items) ? existingData.items : []
      currentRecord = existingList.find((p: any) => p.id === params.id || p.slug === params.id)
      if (currentRecord?.id) targetId = currentRecord.id

      const baseSlug =
        decodeProductSlug(currentRecord?.slug).baseSlug ||
        findDefaultProduct(params.id)?.slug ||
        slugifyText(payload.name || currentRecord?.name || params.id)

      let candidateSlug = encodeProductSlug(baseSlug, String(body.category || ''))
      const collision = existingList.some((p: any) => p.id !== targetId && p.slug === candidateSlug)
      if (collision) {
        candidateSlug = `${candidateSlug.slice(0, 155)}-${Date.now().toString(36)}`
      }
      payload.slug = candidateSlug
    }

    try {
      const updated = await remoteStore.updateProduct(targetId, payload, authHeader)
      return NextResponse.json({ item: normalizeProductRecord(updated) })
    } catch (innerErr: any) {
      const code = Number(innerErr?.status) || 500
      // Fallback if default product was referenced by slug or needs creation
      if (code === 404 || code === 500) {
        const existingData = await remoteStore.adminProducts(authHeader).catch(() => ({ items: [] }))
        const existingList = Array.isArray(existingData?.items) ? existingData.items : []
        const matched = existingList.find(
          (p: any) =>
            p.id === params.id ||
            p.slug === params.id ||
            decodeProductSlug(p.slug).baseSlug === params.id
        )
        if (matched?.id && matched.id !== targetId) {
          const retried = await remoteStore.updateProduct(matched.id, payload, authHeader)
          return NextResponse.json({ item: normalizeProductRecord(retried) })
        }
        const def = findDefaultProduct(params.id)
        if (def) {
          const created = await remoteStore.createProduct(
            {
              name: payload.name ?? def.name,
              slug: payload.slug ?? encodeProductSlug(def.slug, body.category ?? def.category),
              price: payload.price ?? def.price,
              description: payload.description ?? def.description,
              imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : def.imageUrl,
              sizes: payload.sizes ?? def.sizes,
              published: payload.published ?? def.published,
              active: payload.active ?? def.active,
            },
            authHeader
          )
          return NextResponse.json({ item: normalizeProductRecord(created) })
        }
      }
      throw innerErr
    }
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Modification impossible.'
    return NextResponse.json({ message }, { status })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_products')
  if (res) return res

  const mode = req.nextUrl.searchParams.get('mode')

  try {
    if (mode === 'hide') {
      const hidden = await remoteStore.updateProduct(
        params.id,
        { active: false, published: false },
        authHeader
      )
      return NextResponse.json({ item: normalizeProductRecord(hidden) })
    }

    const def = findDefaultProduct(params.id)
    // Tombstone slug ensures compatibility even if remote backend runs an older build without DELETE route
    // or with startup default-product seeding by ID.
    if (!def) {
      try {
        await remoteStore.deleteProduct(params.id, authHeader)
        return NextResponse.json({ ok: true, id: params.id })
      } catch {
        // Fall through to tombstone update if DELETE route is not yet deployed on remote server
      }
    }

    const tombstoneSlug = `deleted-${slugifyText(params.id).slice(0, 80)}-${Date.now().toString(36)}`
    await remoteStore.updateProduct(
      params.id,
      { slug: tombstoneSlug, active: false, published: false },
      authHeader
    )
    return NextResponse.json({ ok: true, id: params.id })
  } catch (error) {
    const status = (error as { status?: number }).status || 502
    const message = error instanceof Error ? error.message : 'Suppression impossible.'
    return NextResponse.json({ message }, { status })
  }
}
