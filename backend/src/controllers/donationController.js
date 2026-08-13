import { prisma } from '../lib/prisma.js'

export async function listDonations(req, res) {
  const { status } = req.query
  const where = { deletedAt: null }
  if (status) where.status = status
  const [items, totalCollected] = await Promise.all([
    prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.donation.aggregate({ where: { status: 'validated', deletedAt: null }, _sum: { amount: true } }),
  ])
  res.json({ donations: items, totalCollected: totalCollected._sum.amount || 0 })
}

export async function createDonation(req, res) {
  const { donor, email, phone, amount, method } = req.body || {}
  if (!donor || !email || !amount || !['stripe', 'mvola'].includes(method)) {
    return res.status(400).json({ success: false, error: 'Données de don invalides' })
  }
  const item = await prisma.donation.create({
    data: {
      donor: String(donor).slice(0, 120),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 40) : null,
      amount: Number(amount) || 0,
      method,
      status: 'pending',
    },
  })
  res.status(201).json({ success: true, id: item.id, status: item.status })
}

export async function updateDonation(req, res) {
  const item = await prisma.donation.update({ where: { id: req.params.id }, data: req.body || {} })
  res.json({ success: true, item })
}

export async function deleteDonation(req, res) {
  await prisma.donation.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
