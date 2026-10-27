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

export async function listProducts(_req, res) {
  const items = await prisma.storeProduct.findMany({
    where: { published: true, active: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ items })
}

export async function listProductsForAdmin(_req, res) {
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
    if (!entry || typeof entry.productId !== 'string' || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 10) {
      return res.status(400).json({ success: false, error: 'Un article ou une quantité est invalide.' })
    }
    const size = typeof entry.size === 'string' ? entry.size.trim().slice(0, 20) : ''
    const key = `${entry.productId}\u0000${size}`
    const current = selections.get(key)
    if (current) {
      current.quantity += entry.quantity
      if (current.quantity > 10) return res.status(400).json({ success: false, error: 'La quantité maximale par article est de 10.' })
    } else {
      selections.set(key, { productId: entry.productId, quantity: entry.quantity, size })
    }
  }

  const productIds = [...new Set([...selections.values()].map((selection) => selection.productId))]
  const products = await prisma.storeProduct.findMany({
    where: { id: { in: productIds }, published: true, active: true },
  })
  if (products.length !== productIds.length) {
    return res.status(400).json({ success: false, error: 'Un article n’est plus disponible. Actualise le catalogue et réessaie.' })
  }

  const productById = new Map(products.map((product) => [product.id, product]))
  const items = []
  for (const selection of selections.values()) {
    const product = productById.get(selection.productId)
    if (!product) return res.status(400).json({ success: false, error: 'Un article n’est plus disponible.' })
    if (product.sizes.length && !selection.size) {
      return res.status(400).json({ success: false, error: `Choisis une taille pour ${product.name}.` })
    }
    if (selection.size && product.sizes.length && !product.sizes.includes(selection.size)) {
      return res.status(400).json({ success: false, error: `La taille sélectionnée n’est pas disponible pour ${product.name}.` })
    }
    items.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: selection.quantity,
      size: selection.size || null,
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
