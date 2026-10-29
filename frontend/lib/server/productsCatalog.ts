export type ProductCategory = 'Vêtements' | 'Accessoires' | 'Traditionnel' | 'Collector' | 'Articles'

export type CatalogProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  sizes: string[]
  category: ProductCategory
  active: boolean
  published: boolean
}

const CATEGORY_PREFIX_TO_LABEL: Record<string, ProductCategory> = {
  vetements: 'Vêtements',
  accessoires: 'Accessoires',
  traditionnel: 'Traditionnel',
  collector: 'Collector',
  articles: 'Articles',
}

const LABEL_TO_CATEGORY_PREFIX: Record<string, string> = {
  'Vêtements': 'vetements',
  Accessoires: 'accessoires',
  Traditionnel: 'traditionnel',
  Collector: 'collector',
  Articles: 'articles',
}

export const DEFAULT_STORE_PRODUCTS: CatalogProduct[] = [
  {
    id: 'store-teddy',
    slug: 'blouson-teddy',
    name: 'Blouson Teddy REKOMA',
    description:
      'Blouson collector de haute qualité aux finitions soignées, brodé aux couleurs de REKOMA Midongy Atsimo.',
    price: 60000,
    imageUrl: '/ARTICLE/BLOUSON TEDDY 2.jpg',
    sizes: ['M', 'L', 'XL'],
    category: 'Vêtements',
    active: true,
    published: true,
  },
  {
    id: 'store-hoodie',
    slug: 'sweat-capuche',
    name: 'Sweat à capuche REKOMA',
    description:
      'Sweat à capuche chaud et confortable en molleton épais avec cordons ajustables et logo officiel.',
    price: 55000,
    imageUrl: '/ARTICLE/SWEAT A CAPUCHE.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    category: 'Vêtements',
    active: true,
    published: true,
  },
  {
    id: 'store-doudoune',
    slug: 'doudoune-rekoma',
    name: 'Doudoune sans manche REKOMA',
    description:
      'Doudoune matelassée sans manche légère et isolante, idéale pour le terrain et la mi-saison.',
    price: 45000,
    imageUrl: '/ARTICLE/DOUDONE SANS MANCHE.jpg',
    sizes: ['M', 'L', 'XL'],
    category: 'Vêtements',
    active: true,
    published: true,
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
    active: true,
    published: true,
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
    active: true,
    published: true,
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
    active: true,
    published: true,
  },
  {
    id: 'store-salova',
    slug: 'salova-rekoma',
    name: 'Salova traditionnel malagasy',
    description:
      'Tenue traditionnelle malagasy d’honneur aux motifs culturels régionaux de l’Atsimo-Atsinanana.',
    price: 30000,
    imageUrl: '/ARTICLE/tenu tradutionnel malagasy, SALOVA.jpg',
    sizes: [],
    category: 'Traditionnel',
    active: true,
    published: true,
  },
  {
    id: 'store-cap',
    slug: 'casquette-rekoma',
    name: 'Casquette brodée REKOMA',
    description:
      'Casquette 6 panneaux avec visière profilée et fermeture arrière ajustable en laiton.',
    price: 15000,
    imageUrl: '/ARTICLE/CASQUETTE.jpg',
    sizes: [],
    category: 'Accessoires',
    active: true,
    published: true,
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
    active: true,
    published: true,
  },
  {
    id: 'store-peluche',
    slug: 'peluche-rekoma',
    name: 'Peluche mascotte REKOMA',
    description:
      'Peluche douce collector en soutien direct aux actions de développement communautaire.',
    price: 20000,
    imageUrl: '/ARTICLE/PELLUCHE.jpg',
    sizes: [],
    category: 'Accessoires',
    active: true,
    published: true,
  },
]

export function slugifyText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140)
}

export function isDeletedProductSlug(slug?: string | null): boolean {
  return typeof slug === 'string' && slug.startsWith('deleted-')
}

export function decodeProductSlug(rawSlug?: string | null): {
  baseSlug: string
  categoryFromSlug: ProductCategory | null
} {
  const clean = String(rawSlug || '').trim()
  const match = clean.match(/^cat-(vetements|accessoires|traditionnel|collector|articles)-(.+)$/)
  if (match) {
    return {
      categoryFromSlug: CATEGORY_PREFIX_TO_LABEL[match[1]] || null,
      baseSlug: match[2],
    }
  }
  return { baseSlug: clean, categoryFromSlug: null }
}

export function encodeProductSlug(baseNameOrSlug: string, category?: string | null): string {
  const { baseSlug: stripped } = decodeProductSlug(slugifyText(baseNameOrSlug))
  const core = stripped || `article-${Date.now().toString(36)}`
  const prefix = category ? LABEL_TO_CATEGORY_PREFIX[category] : undefined
  if (!prefix) return core
  return `cat-${prefix}-${core}`.slice(0, 175)
}

export function findDefaultProduct(idOrSlug?: string | null, rawSlug?: string | null): CatalogProduct | undefined {
  const { baseSlug } = decodeProductSlug(rawSlug || idOrSlug)
  return DEFAULT_STORE_PRODUCTS.find(
    (def) => def.id === idOrSlug || def.slug === idOrSlug || def.slug === baseSlug
  )
}

export function normalizeProductRecord(item: any): CatalogProduct {
  const def = findDefaultProduct(item?.id, item?.slug)
  const { categoryFromSlug } = decodeProductSlug(item?.slug)
  const sizes = Array.isArray(item?.sizes)
    ? item.sizes.map((s: unknown) => String(s).trim()).filter(Boolean)
    : def?.sizes || []

  const category: ProductCategory =
    (item?.category as ProductCategory) ||
    categoryFromSlug ||
    def?.category ||
    (sizes.length > 0 ? 'Vêtements' : 'Accessoires')

  return {
    id: String(item?.id || def?.id || ''),
    slug: String(item?.slug || def?.slug || ''),
    name: String(item?.name || def?.name || '').trim(),
    description: typeof item?.description === 'string' ? item.description : def?.description || '',
    price: Number.isFinite(Number(item?.price)) ? Math.max(0, Math.round(Number(item.price))) : def?.price || 0,
    imageUrl: item?.imageUrl !== undefined ? item.imageUrl : def?.imageUrl || null,
    sizes,
    category,
    active: item?.active !== false,
    published: item?.published !== false,
  }
}
