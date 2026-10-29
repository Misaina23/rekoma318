import { prisma } from '../lib/prisma.js'

export async function listMembersPublic(req, res) {
  const items = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ['inactive', 'deleted', 'archived'] },
    },
    orderBy: [{ displayOrder: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      sex: true,
      role: true,
      designation: true,
      description: true,
      photo: true,
      status: true,
      displayOrder: true,
    },
  })
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.json(items)
}

export async function listMembers(req, res) {
  const { q, status } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }]
  if (status) where.status = status
  const items = await prisma.member.findMany({ where, orderBy: [{ displayOrder: 'asc' }, { lastName: 'asc' }] })
  res.set('Cache-Control', 'no-store')
  res.json(items)
}

function parseDisplayOrder(value) {
  if (value === undefined || value === null || value === '') return 999
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 999
}

export async function createMember(req, res) {
  const { firstName, lastName, sex, role, address, phone, email, status, photo, designation, displayOrder, description } = req.body || {}
  if (!firstName || !lastName) return res.status(400).json({ success: false, error: 'Nom et prénom requis' })
  const item = await prisma.member.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      sex: sex === 'F' ? 'F' : 'M',
      role: role || null,
      designation: designation || null,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      status: status === 'inactive' ? 'inactive' : 'active',
      photo: photo || null,
      displayOrder: parseDisplayOrder(displayOrder),
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateMember(req, res) {
  const { firstName, lastName, sex, role, address, phone, email, status, photo, designation, displayOrder, description } = req.body || {}
  const data = {}
  if (firstName !== undefined) data.firstName = String(firstName).trim()
  if (lastName !== undefined) data.lastName = String(lastName).trim()
  if (sex !== undefined) data.sex = sex === 'F' ? 'F' : 'M'
  if (role !== undefined) data.role = role || null
  if (designation !== undefined) data.designation = designation || null
  if (description !== undefined) data.description = description || null
  if (address !== undefined) data.address = address || null
  if (phone !== undefined) data.phone = phone || null
  if (email !== undefined) data.email = email || null
  if (status !== undefined) data.status = status === 'inactive' ? 'inactive' : 'active'
  if (photo !== undefined) data.photo = photo || null
  if (displayOrder !== undefined) data.displayOrder = parseDisplayOrder(displayOrder)
  const item = await prisma.member.update({ where: { id: req.params.id }, data })
  res.json({ success: true, item })
}

export async function deleteMember(req, res) {
  await prisma.member.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
