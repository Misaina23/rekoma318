import { NextResponse } from 'next/server'
import { remoteStore } from '@/lib/server/remote'
import {
  DEFAULT_STORE_PRODUCTS,
  isDeletedProductSlug,
  normalizeProductRecord,
} from '@/lib/server/productsCatalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const remoteData = await remoteStore.products()
    if (remoteData && Array.isArray(remoteData.items)) {
      const items = remoteData.items
        .filter(
          (item: any) =>
            item &&
            !isDeletedProductSlug(item.slug) &&
            item.published !== false &&
            item.active !== false
        )
        .map((item: any) => normalizeProductRecord(item))

      return NextResponse.json(
        { items },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }

    return NextResponse.json(
      { items: DEFAULT_STORE_PRODUCTS },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    console.warn('Unable to load public store products from backend, using default catalogue:', error)
    return NextResponse.json(
      { items: DEFAULT_STORE_PRODUCTS },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  }
}
