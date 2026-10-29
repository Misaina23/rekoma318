import { NextResponse } from 'next/server'
import { remoteStore } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

const DEFAULT_PRODUCTS = [
  {
    id: 'store-teddy',
    slug: 'blouson-teddy',
    name: 'Blouson Teddy REKOMA',
    description: 'Blouson collector de haute qualité aux finitions soignées, brodé aux couleurs de REKOMA Midongy Atsimo.',
    price: 60000,
    imageUrl: '/ARTICLE/BLOUSON TEDDY 2.jpg',
    sizes: ['M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-hoodie',
    slug: 'sweat-capuche',
    name: 'Sweat à capuche REKOMA',
    description: 'Sweat à capuche chaud et confortable en molleton épais avec cordons ajustables et logo officiel.',
    price: 55000,
    imageUrl: '/ARTICLE/SWEAT A CAPUCHE.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-doudoune',
    slug: 'doudoune-rekoma',
    name: 'Doudoune sans manche REKOMA',
    description: 'Doudoune matelassée sans manche légère et isolante, idéale pour le terrain et la mi-saison.',
    price: 45000,
    imageUrl: '/ARTICLE/DOUDONE SANS MANCHE.jpg',
    sizes: ['M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-polo',
    slug: 'polo-rekoma',
    name: 'Polo officiel REKOMA',
    description: 'Polo piqué 100% coton peigné, col boutonné renforcé et écusson brodé REKOMA.',
    price: 35000,
    imageUrl: '/ARTICLE/POLO.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-tee',
    slug: 'tee-shirt-rekoma',
    name: 'T-shirt classique REKOMA',
    description: 'T-shirt en coton peigné durable et respirant avec sérigraphie haute résistance.',
    price: 25000,
    imageUrl: '/ARTICLE/TEE SHIRT.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    category: 'Vêtements',
  },
  {
    id: 'store-oversize',
    slug: 'tee-shirt-oversize',
    name: 'T-shirt oversize streetwear REKOMA',
    description: 'Coupe ample oversize moderne aux couleurs et emblèmes de Midongy 318.',
    price: 45000,
    imageUrl: '/ARTICLE/TEE SHRT 2.jpg',
    sizes: ['M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-salova',
    slug: 'salova-rekoma',
    name: 'Salova traditionnel malagasy',
    description: 'Tenue traditionnelle malagasy d’honneur aux motifs culturels régionaux de l’Atsimo-Atsinanana.',
    price: 30000,
    imageUrl: '/ARTICLE/tenu tradutionnel malagasy, SALOVA.jpg',
    sizes: [],
    category: 'Traditionnel',
  },
  {
    id: 'store-cap',
    slug: 'casquette-rekoma',
    name: 'Casquette brodée REKOMA',
    description: 'Casquette 6 panneaux avec visière profilée et fermeture arrière ajustable en laiton.',
    price: 15000,
    imageUrl: '/ARTICLE/CASQUETTE.jpg',
    sizes: [],
    category: 'Accessoires',
  },
  {
    id: 'store-tank',
    slug: 'debardeur-rekoma',
    name: 'Débardeur sport REKOMA',
    description: 'Débardeur respirant et confortable pour le sport et les activités de plein air.',
    price: 25000,
    imageUrl: '/ARTICLE/DEBARDEUR.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'Vêtements',
  },
  {
    id: 'store-peluche',
    slug: 'peluche-rekoma',
    name: 'Peluche mascotte REKOMA',
    description: 'Peluche douce collector en soutien direct aux actions de développement communautaire.',
    price: 20000,
    imageUrl: '/ARTICLE/PELLUCHE.jpg',
    sizes: [],
    category: 'Accessoires',
  },
]

export async function GET() {
  try {
    const remoteData = await remoteStore.products()
    if (remoteData?.items && remoteData.items.length > 0) {
      const byKey = new Map<string, any>()
      for (const def of DEFAULT_PRODUCTS) {
        byKey.set(def.id, def)
        byKey.set(def.slug, def)
      }

      const seenIds = new Set<string>()
      const seenSlugs = new Set<string>()
      const enriched = remoteData.items.map((item: any) => {
        if (item.id) seenIds.add(item.id)
        if (item.slug) seenSlugs.add(item.slug)
        const def = byKey.get(item.id) || byKey.get(item.slug)
        const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0
        return {
          ...item,
          sizes: hasSizes ? item.sizes : def?.sizes || [],
          category: item.category || def?.category || 'Articles',
          description: item.description || def?.description || '',
          imageUrl: item.imageUrl || def?.imageUrl || null,
        }
      })

      for (const def of DEFAULT_PRODUCTS) {
        if (!seenIds.has(def.id) && !seenSlugs.has(def.slug)) {
          enriched.push(def)
        }
      }

      return NextResponse.json(
        { items: enriched },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }
    return NextResponse.json({ items: DEFAULT_PRODUCTS })
  } catch (error) {
    console.warn('Unable to load public store products from backend, using default catalogue:', error)
    return NextResponse.json({ items: DEFAULT_PRODUCTS })
  }
}
