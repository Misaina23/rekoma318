import { prisma } from '../lib/prisma.js'

const PAGE_SIZE = 4

export async function listBeneficiaries(req, res) {
  const { q, category, formationId, status, sex, commune, page } = req.query
  const where = { deletedAt: null }

  if (q) {
    const term = String(q)
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { cin: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { commune: { contains: term, mode: 'insensitive' } },
      { name: { contains: term, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category
  if (formationId) where.formationId = formationId
  if (status) where.status = status
  if (sex) where.sex = sex
  if (commune) where.commune = commune

  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * PAGE_SIZE

  const [items, total] = await Promise.all([
    prisma.beneficiary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: { formation: { select: { id: true, title: true } } },
    }),
    prisma.beneficiary.count({ where }),
  ])

  res.json({ items, total, page: pageNum, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) })
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
  const {
    firstName,
    lastName,
    cin,
    birthDate,
    sex,
    phone,
    address,
    commune,
    name,
    category,
    formationId,
    contact,
    status,
    attendance,
  } = req.body || {}

  if (!firstName || !lastName) return res.status(400).json({ success: false, error: 'Nom et prénom requis' })
  if (!name) return res.status(400).json({ success: false, error: 'Nom complet requis' })

  const data = {
    firstName: String(firstName),
    lastName: String(lastName),
    name: String(name),
    category: category || 'Autre',
    formationId: formationId || null,
    contact: contact || null,
    status: status || 'active',
    sex: sex === 'F' ? 'F' : 'M',
    phone: phone || null,
    address: address || null,
    commune: commune || null,
    attendance: attendance || null,
  }

  if (birthDate) data.birthDate = new Date(birthDate)
  if (cin) data.cin = String(cin)

  try {
    const item = await prisma.beneficiary.create({
      data,
      include: { formation: { select: { id: true, title: true } } },
    })
    res.status(201).json({ success: true, item })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Ce CIN existe déjà.' })
    }
    throw err
  }
}

export async function updateBeneficiary(req, res) {
  const {
    firstName,
    lastName,
    cin,
    birthDate,
    sex,
    phone,
    address,
    commune,
    name,
    category,
    formationId,
    contact,
    status,
    attendance,
  } = req.body || {}

  const data = {}
  if (firstName !== undefined) data.firstName = String(firstName)
  if (lastName !== undefined) data.lastName = String(lastName)
  if (name !== undefined) data.name = String(name)
  if (category !== undefined) data.category = String(category)
  if (formationId !== undefined) data.formationId = formationId || null
  if (contact !== undefined) data.contact = contact || null
  if (status !== undefined) data.status = String(status)
  if (sex !== undefined) data.sex = sex === 'F' ? 'F' : 'M'
  if (phone !== undefined) data.phone = phone || null
  if (address !== undefined) data.address = address || null
  if (commune !== undefined) data.commune = commune || null
  if (attendance !== undefined) data.attendance = attendance || null
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
  if (cin !== undefined) data.cin = cin ? String(cin) : null

  try {
    const item = await prisma.beneficiary.update({ where: { id: req.params.id }, data })
    res.json({ success: true, item })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Ce CIN existe déjà.' })
    }
    throw err
  }
}

export async function deleteBeneficiary(req, res) {
  await prisma.beneficiary.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
