import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listProducteurs(req, res) {
  const { page = 1, perPage = 20, q } = req.query
  const where = q ? { nom: { contains: q, mode: 'insensitive' } } : {}
  const skip = (Number(page) - 1) * Number(perPage)
  const [items, total] = await Promise.all([
    prisma.producteur.findMany({ where, skip, take: Number(perPage), orderBy: { createdAt: 'desc' } }),
    prisma.producteur.count({ where }),
  ])
  res.json({ success: true, items, total })
}

export async function createProducteur(req, res) {
  const { nom, description } = req.body
  if (!nom) return res.status(400).json({ success: false, error: 'Missing nom' })
  const item = await prisma.producteur.create({ data: { nom, description } })
  res.status(201).json({ success: true, item })
}

export async function getProducteur(req, res) {
  const { id } = req.params
  const item = await prisma.producteur.findUnique({ where: { id } })
  if (!item) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, item })
}

export async function updateProducteur(req, res) {
  const { id } = req.params
  const { nom, description, actif } = req.body
  const item = await prisma.producteur.update({ where: { id }, data: { nom, description, actif } })
  res.json({ success: true, item })
}

export async function deleteProducteur(req, res) {
  const { id } = req.params
  await prisma.producteur.delete({ where: { id } })
  res.json({ success: true })
}
