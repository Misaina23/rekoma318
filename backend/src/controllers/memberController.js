import { prisma } from '../lib/prisma.js'

export async function listMembersPublic(req, res) {
  const items = await prisma.member.findMany({
    where: { status: 'active', deletedAt: null },
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
    },
  })
  res.json(items)
}

export async function listMembers(req, res) {
  const { q, status } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }]
  if (status) where.status = status
  const items = await prisma.member.findMany({ where, orderBy: [{ displayOrder: 'asc' }, { lastName: 'asc' }] })
  res.json(items)
}

export async function createMember(req, res) {
  const { firstName, lastName, sex, role, address, phone, email, status, photo, designation, displayOrder, description } = req.body || {}
  if (!firstName || !lastName) return res.status(400).json({ success: false, error: 'Nom et prénom requis' })
  const item = await prisma.member.create({
    data: {
      firstName: String(firstName),
      lastName: String(lastName),
      sex: sex === 'F' ? 'F' : 'M',
      role: role || null,
      designation: designation || null,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      status: status === 'inactive' ? 'inactive' : 'active',
      photo: photo || null,
      displayOrder: Number(displayOrder) || 999,
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateMember(req, res) {
  const { firstName, lastName, sex, role, address, phone, email, status, photo, designation, displayOrder, description } = req.body || {}
  const data = {}
  if (firstName !== undefined) data.firstName = String(firstName)
  if (lastName !== undefined) data.lastName = String(lastName)
  if (sex !== undefined) data.sex = sex === 'F' ? 'F' : 'M'
  if (role !== undefined) data.role = role || null
  if (designation !== undefined) data.designation = designation || null
  if (description !== undefined) data.description = description || null
  if (address !== undefined) data.address = address || null
  if (phone !== undefined) data.phone = phone || null
  if (email !== undefined) data.email = email || null
  if (status !== undefined) data.status = status === 'inactive' ? 'inactive' : 'active'
  if (photo !== undefined) data.photo = photo || null
  if (displayOrder !== undefined) data.displayOrder = Number(displayOrder) || 999
  const item = await prisma.member.update({ where: { id: req.params.id }, data })
  res.json({ success: true, item })
}

export async function deleteMember(req, res) {
  await prisma.member.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
