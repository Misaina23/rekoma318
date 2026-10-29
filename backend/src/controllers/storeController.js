import { prisma } from '../lib/prisma.js'

const ORDER_STATUSES = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled']

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
}

function validateProductInput(body, partial = false) {
  const data = {}
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return { error: 'Le nom de l’article est requis.' }
    data.name = body.name.trim().slice(0, 200)
  }
  if (!partial || body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isSafeInteger(price) || price < 0) return { error: 'Le prix doit être un nombre entier positif.' }
    data.price = price
  }
  if (!partial || body.description !== undefined) {
    if (body.description !== undefined && typeof body.description !== 'string') return { error: 'Description invalide.' }
    data.description = String(body.description || '').trim().slice(0, 2000)
  }
  if (!partial || body.imageUrl !== undefined) {
    if (body.imageUrl !== undefined && body.imageUrl !== null && typeof body.imageUrl !== 'string') return { error: 'Image invalide.' }
    data.imageUrl = body.imageUrl ? String(body.imageUrl).trim().slice(0, 500) : null
  }
  if (!partial || body.sizes !== undefined) {
    if (body.sizes !== undefined && (!Array.isArray(body.sizes) || body.sizes.some((size) => typeof size !== 'string'))) {
      return { error: 'Tailles invalides.' }
    }
    data.sizes = Array.isArray(body.sizes)
      ? [...new Set(body.sizes.map((size) => size.trim().slice(0, 20)).filter(Boolean))].slice(0, 20)
      : []
  }
  for (const key of ['published', 'active']) {
    if (!partial || body[key] !== undefined) {
      if (body[key] !== undefined && typeof body[key] !== 'boolean') return { error: 'Statut de publication invalide.' }
      data[key] = body[key] !== false
    }
  }
  if (body.slug !== undefined || !partial) {
    const slug = slugify(body.slug || data.name)
    if (!slug) return { error: 'Le nom doit contenir au moins une lettre ou un chiffre.' }
    data.slug = slug
  }
  return { data }
}

const DEFAULT_STORE_PRODUCTS = [
  {
    id: 'store-teddy',
    slug: 'blouson-teddy',
    name: 'Blouson Teddy REKOMA',
    description: 'Blouson collector de haute qualité aux finitions soignées, brodé aux couleurs de REKOMA Midongy Atsimo.',
    price: 60000,
    imageUrl: '/ARTICLE/BLOUSON TEDDY 2.jpg',
    sizes: ['M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-hoodie',
    slug: 'sweat-capuche',
    name: 'Sweat à capuche REKOMA',
    description: 'Sweat à capuche chaud et confortable en molleton épais avec cordons ajustables et logo officiel.',
    price: 55000,
    imageUrl: '/ARTICLE/SWEAT A CAPUCHE.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-doudoune',
    slug: 'doudoune-rekoma',
    name: 'Doudoune sans manche REKOMA',
    description: 'Doudoune matelassée sans manche légère et isolante, idéale pour le terrain et la mi-saison.',
    price: 45000,
    imageUrl: '/ARTICLE/DOUDONE SANS MANCHE.jpg',
    sizes: ['M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-polo',
    slug: 'polo-rekoma',
    name: 'Polo officiel REKOMA',
    description: 'Polo piqué 100% coton peigné, col boutonné renforcé et écusson brodé REKOMA.',
    price: 35000,
    imageUrl: '/ARTICLE/POLO.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-tee',
    slug: 'tee-shirt-rekoma',
    name: 'T-shirt classique REKOMA',
    description: 'T-shirt en coton peigné durable et respirant avec sérigraphie haute résistance.',
    price: 25000,
    imageUrl: '/ARTICLE/TEE SHIRT.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    published: true,
    active: true,
  },
  {
    id: 'store-oversize',
    slug: 'tee-shirt-oversize',
    name: 'T-shirt oversize streetwear REKOMA',
    description: 'Coupe ample oversize moderne aux couleurs et emblèmes de Midongy 318.',
    price: 45000,
    imageUrl: '/ARTICLE/TEE SHRT 2.jpg',
    sizes: ['M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-salova',
    slug: 'salova-rekoma',
    name: 'Salova traditionnel malagasy',
    description: 'Tenue traditionnelle malagasy d’honneur aux motifs culturels régionaux de l’Atsimo-Atsinanana.',
    price: 30000,
    imageUrl: '/ARTICLE/tenu tradutionnel malagasy, SALOVA.jpg',
    sizes: [],
    published: true,
    active: true,
  },
  {
    id: 'store-cap',
    slug: 'casquette-rekoma',
    name: 'Casquette brodée REKOMA',
    description: 'Casquette 6 panneaux avec visière profilée et fermeture arrière ajustable en laiton.',
    price: 15000,
    imageUrl: '/ARTICLE/CASQUETTE.jpg',
    sizes: [],
    published: true,
    active: true,
  },
  {
    id: 'store-tank',
    slug: 'debardeur-rekoma',
    name: 'Débardeur sport REKOMA',
    description: 'Débardeur respirant et confortable pour le sport et les activités de plein air.',
    price: 25000,
    imageUrl: '/ARTICLE/DEBARDEUR.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    published: true,
    active: true,
  },
  {
    id: 'store-peluche',
    slug: 'peluche-rekoma',
    name: 'Peluche mascotte REKOMA',
    description: 'Peluche douce collector en soutien direct aux actions de développement communautaire.',
    price: 20000,
    imageUrl: '/ARTICLE/PELLUCHE.jpg',
    sizes: [],
    published: true,
    active: true,
  },
]

async function ensureDefaultCatalogue() {
  try {
    for (const def of DEFAULT_STORE_PRODUCTS) {
      const existing = await prisma.storeProduct.findFirst({
        where: { OR: [{ id: def.id }, { slug: def.slug }] },
      })
      if (!existing) {
        await prisma.storeProduct.create({ data: def }).catch(() => null)
      } else if ((!Array.isArray(existing.sizes) || existing.sizes.length === 0) && def.sizes.length > 0) {
        await prisma.storeProduct.update({
          where: { id: existing.id },
          data: { sizes: def.sizes },
        }).catch(() => null)
      }
    }
  } catch {
    // Ignore when running against read-only / mock DB
  }
}

export async function listProducts(_req, res) {
  await ensureDefaultCatalogue()
  const items = await prisma.storeProduct.findMany({
    where: { published: true, active: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ items: items.length > 0 ? items : DEFAULT_STORE_PRODUCTS })
}

export async function listProductsForAdmin(_req, res) {
  await ensureDefaultCatalogue()
  const items = await prisma.storeProduct.findMany({ orderBy: { createdAt: 'asc' } })
  res.json({ items })
}

export async function createProduct(req, res) {
  const { data, error } = validateProductInput(req.body || {})
  if (error) return res.status(400).json({ success: false, error })
  const item = await prisma.storeProduct.create({ data })
  res.status(201).json({ success: true, item })
}

export async function updateProduct(req, res) {
  const { data, error } = validateProductInput(req.body || {}, true)
  if (error) return res.status(400).json({ success: false, error })
  if (!Object.keys(data).length) return res.status(400).json({ success: false, error: 'Aucune modification à enregistrer.' })
  const item = await prisma.storeProduct.update({ where: { id: req.params.id }, data })
  res.json({ success: true, item })
}

export async function createOrder(req, res) {
  const body = req.body || {}
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 120) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : ''
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 120) : ''
  const deliveryType = body.deliveryType
  const address = typeof body.address === 'string' ? body.address.trim().slice(0, 500) : ''
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : ''
  const requestedItems = body.items

  if (!customerName || phone.length < 6 || !city) {
    return res.status(400).json({ success: false, error: 'Nom, téléphone et ville sont obligatoires.' })
  }
  if (!['pickup', 'delivery'].includes(deliveryType) || (deliveryType === 'delivery' && !address)) {
    return res.status(400).json({ success: false, error: 'Choisis un retrait ou renseigne une adresse de livraison.' })
  }
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 10) {
    return res.status(400).json({ success: false, error: 'La commande doit contenir entre 1 et 10 articles.' })
  }

  const selections = new Map()
  for (const entry of requestedItems) {
    const rawProductId = typeof entry?.productId === 'string' ? entry.productId.trim() : ''
    const qty = Number(entry?.quantity)
    if (!rawProductId || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({ success: false, error: 'Un article ou une quantité est invalide.' })
    }
    const size = typeof entry.size === 'string' ? entry.size.trim().slice(0, 20) : ''
    const key = `${rawProductId}\u0000${size}`
    const current = selections.get(key)
    if (current) {
      current.quantity += qty
      if (current.quantity > 10) return res.status(400).json({ success: false, error: 'La quantité maximale par article est de 10.' })
    } else {
      selections.set(key, { productId: rawProductId, quantity: qty, size })
    }
  }

  const requestedKeys = [...new Set([...selections.values()].map((selection) => selection.productId))]

  // Ensure any default catalogue item ordered by ID or slug exists in StoreProduct
  for (const reqKey of requestedKeys) {
    const def = DEFAULT_STORE_PRODUCTS.find((p) => p.id === reqKey || p.slug === reqKey)
    if (def) {
      const exists = await prisma.storeProduct.findFirst({
        where: { OR: [{ id: def.id }, { slug: def.slug }] },
      }).catch(() => null)
      if (!exists) {
        await prisma.storeProduct.create({ data: def }).catch(() => null)
      }
    }
  }

  const products = await prisma.storeProduct.findMany({
    where: {
      OR: [{ id: { in: requestedKeys } }, { slug: { in: requestedKeys } }],
      published: true,
      active: true,
    },
  })

  const productLookup = new Map()
  for (const product of products) {
    productLookup.set(product.id, product)
    if (product.slug) productLookup.set(product.slug, product)
  }

  // Fallback to DEFAULT_STORE_PRODUCTS metadata if DB is empty/mocked
  for (const reqKey of requestedKeys) {
    if (!productLookup.has(reqKey)) {
      const def = DEFAULT_STORE_PRODUCTS.find((p) => p.id === reqKey || p.slug === reqKey)
      if (def) {
        productLookup.set(def.id, def)
        productLookup.set(def.slug, def)
      }
    }
  }

  const items = []
  for (const selection of selections.values()) {
    const product = productLookup.get(selection.productId)
    if (!product) {
      return res.status(400).json({ success: false, error: 'Un article commandé est introuvable ou indisponible. Actualise le catalogue et réessaie.' })
    }
    const availableSizes = Array.isArray(product.sizes) ? product.sizes : []
    let normalizedSize = selection.size
    if (availableSizes.length > 0) {
      if (!normalizedSize) {
        return res.status(400).json({ success: false, error: `Choisis une taille pour ${product.name}.` })
      }
      const matched = availableSizes.find((s) => s.toLowerCase() === normalizedSize.toLowerCase())
      if (!matched) {
        return res.status(400).json({ success: false, error: `La taille "${normalizedSize}" n’est pas disponible pour ${product.name}.` })
      }
      normalizedSize = matched
    }
    items.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: selection.quantity,
      size: normalizedSize || null,
    })
  }
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  if (!Number.isSafeInteger(total)) return res.status(400).json({ success: false, error: 'Le total de la commande est invalide.' })

  const order = await prisma.storeOrder.create({
    data: {
      customerName,
      phone,
      city,
      deliveryType,
      address: address || null,
      note: note || null,
      items,
      total,
    },
  })
  res.status(201).json({ success: true, order })
}

export async function listOrders(_req, res) {
  const orders = await prisma.storeOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  res.json({ orders })
}

export async function updateOrder(req, res) {
  const status = req.body?.status
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Statut de commande invalide.' })
  }
  const order = await prisma.storeOrder.update({ where: { id: req.params.id }, data: { status } })
  res.json({ success: true, order })
}
