import { prisma } from '../lib/prisma.js'

export async function listBeneficiaries(req, res) {
  const { q, category, formationId } = req.query
  const where = { deletedAt: null }
  if (q) where.name = { contains: q, mode: 'insensitive' }
  if (category) where.category = category
  if (formationId) where.formationId = formationId
  const items = await prisma.beneficiary.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { formation: { select: { id: true, title: true } } },
  })
  res.json(items)
}

export async function beneficiaryStats(req, res) {
  const [total, byCategory] = await Promise.all([
    prisma.beneficiary.count({ where: { deletedAt: null } }),
    prisma.beneficiary.groupBy({ by: ['category'], where: { deletedAt: null }, _count: { _all: true } }),
  ])
  const breakdown = byCategory.reduce((acc, g) => {
    acc[g.category] = g._count._all
    return acc
  }, {})
  for (const c of ['Distribution', 'Emploi', 'Formation', 'Autre']) {
    if (!(c in breakdown)) breakdown[c] = 0
  }
  res.json({ total, breakdown })
}

export async function createBeneficiary(req, res) {
  const { name, category, formationId, contact } = req.body || {}
  if (!name) return res.status(400).json({ success: false, error: 'Nom requis' })
  const item = await prisma.beneficiary.create({
    data: {
      name: String(name),
      category: category || 'Autre',
      formationId: formationId || null,
      contact: contact || null,
    },
    include: { formation: { select: { id: true, title: true } } },
  })
  res.status(201).json({ success: true, item })
}

export async function updateBeneficiary(req, res) {
  const { name, category, formationId, contact } = req.body || {}
  const data = {}
  if (name !== undefined) data.name = String(name)
  if (category !== undefined) data.category = String(category)
  if (formationId !== undefined) data.formationId = formationId || null
  if (contact !== undefined) data.contact = contact || null
  const item = await prisma.beneficiary.update({ where: { id: req.params.id }, data })
  res.json({ success: true, item })
}

export async function deleteBeneficiary(req, res) {
  await prisma.beneficiary.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
