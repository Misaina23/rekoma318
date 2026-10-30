import { prisma } from '../lib/prisma.js'
import { ensureRelationalSchema } from '../lib/ensureSchema.js'

const PAGE_SIZE = 5

export const BENEFICIARY_CATEGORIES = [
  'Agriculture & SRI',
  'Maraîchage',
  'Élevage avicole',
  'Eau & WASH',
  'Distribution communautaire',
  'Autre',
]

function serializeBeneficiary(b) {
  const enrollments = Array.isArray(b.formationEnrollments) ? b.formationEnrollments : []
  return {
    ...b,
    formationsCount: enrollments.length,
    formations: enrollments
      .filter((e) => e.formation && !e.formation.deletedAt)
      .map((e) => ({
        enrollmentId: e.id,
        id: e.formation.id,
        title: e.formation.title,
        session: e.formation.session,
        status: e.formation.status,
        attendanceStatus: e.attendanceStatus,
        evaluationScore: e.evaluationScore,
        certificateIssued: e.certificateIssued,
        enrolledAt: e.enrolledAt,
      })),
  }
}

export async function listBeneficiaries(req, res) {
  await ensureRelationalSchema()
  const { q, category, formationId, status, sex, commune, all, page } = req.query
  const where = { deletedAt: null }

  if (q) {
    const term = String(q).trim()
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { cin: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { commune: { contains: term, mode: 'insensitive' } },
      { fokontany: { contains: term, mode: 'insensitive' } },
      { name: { contains: term, mode: 'insensitive' } },
    ]
  }
  if (category) where.category = String(category)
  if (formationId) {
    where.formationEnrollments = {
      some: { formationId: String(formationId) },
    }
  }
  if (status) where.status = String(status)
  if (sex) where.sex = String(sex)
  if (commune) where.commune = { equals: String(commune), mode: 'insensitive' }

  const wantAll = String(all) === '1' || String(all) === 'true'
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = wantAll ? 0 : (pageNum - 1) * PAGE_SIZE
  const take = wantAll ? 500 : PAGE_SIZE

  const [rawItems, total] = await Promise.all([
    prisma.beneficiary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        formationEnrollments: {
          orderBy: { enrolledAt: 'desc' },
          include: {
            formation: {
              select: { id: true, title: true, session: true, status: true, deletedAt: true },
            },
          },
        },
      },
    }),
    prisma.beneficiary.count({ where }),
  ])

  const items = rawItems.map(serializeBeneficiary)
  res.set('Cache-Control', 'no-store')
  res.json({
    items,
    total,
    page: pageNum,
    pageSize: wantAll ? items.length || PAGE_SIZE : PAGE_SIZE,
    totalPages: wantAll ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

export async function beneficiaryStats(req, res) {
  await ensureRelationalSchema()
  const [total, active, byCategory, communesGroup, householdsAgg, enrolledCount] = await Promise.all([
    prisma.beneficiary.count({ where: { deletedAt: null } }),
    prisma.beneficiary.count({ where: { deletedAt: null, status: 'active' } }),
    prisma.beneficiary.groupBy({ by: ['category'], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.beneficiary.groupBy({
      by: ['commune'],
      where: { deletedAt: null, commune: { not: null } },
      _count: { _all: true },
    }),
    prisma.beneficiary.aggregate({
      where: { deletedAt: null },
      _sum: { householdSize: true },
    }),
    prisma.formationEnrollment.count({
      where: { beneficiary: { deletedAt: null }, formation: { deletedAt: null } },
    }),
  ])

  const breakdown = byCategory.reduce((acc, g) => {
    if (g.category && g.category !== 'Emploi') {
      acc[g.category] = g._count._all
    }
    return acc
  }, {})

  for (const c of BENEFICIARY_CATEGORIES) {
    if (!(c in breakdown)) breakdown[c] = 0
  }

  const communes = communesGroup
    .filter((g) => g.commune && String(g.commune).trim() !== '')
    .map((g) => ({ commune: g.commune, count: g._count._all }))

  res.set('Cache-Control', 'no-store')
  res.json({
    total,
    active,
    enrolledInFormations: enrolledCount,
    communesCount: communes.length,
    householdsTotal: householdsAgg._sum.householdSize || 0,
    communes,
    breakdown,
  })
}

export async function createBeneficiary(req, res) {
  await ensureRelationalSchema()
  const {
    firstName,
    lastName,
    cin,
    birthDate,
    sex,
    phone,
    email,
    address,
    commune,
    fokontany,
    householdSize,
    name,
    category,
    contact,
    status,
    notes,
  } = req.body || {}

  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, error: 'Nom et prénom requis' })
  }

  const cleanFirst = String(firstName).trim()
  const cleanLast = String(lastName).trim()
  const fullName = name && String(name).trim() ? String(name).trim() : `${cleanLast} ${cleanFirst}`
  const cleanCategory =
    category && String(category) !== 'Emploi' ? String(category) : 'Agriculture & SRI'

  const data = {
    firstName: cleanFirst,
    lastName: cleanLast,
    name: fullName,
    category: cleanCategory,
    contact: contact ? String(contact).trim() : phone ? String(phone).trim() : null,
    status: status || 'active',
    sex: sex === 'F' ? 'F' : 'M',
    phone: phone ? String(phone).trim() : null,
    email: email ? String(email).trim() : null,
    address: address ? String(address).trim() : null,
    commune: commune ? String(commune).trim() : null,
    fokontany: fokontany ? String(fokontany).trim() : null,
    householdSize: householdSize !== undefined && householdSize !== '' && householdSize !== null ? Math.max(1, Number(householdSize) || 1) : null,
    notes: notes ? String(notes).trim() : null,
  }

  if (birthDate) data.birthDate = new Date(birthDate)
  if (cin && String(cin).trim()) data.cin = String(cin).trim()

  try {
    const item = await prisma.beneficiary.create({
      data,
      include: {
        formationEnrollments: {
          include: { formation: { select: { id: true, title: true, session: true, status: true, deletedAt: true } } },
        },
      },
    })
    res.status(201).json({ success: true, item: serializeBeneficiary(item) })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Ce numéro CIN existe déjà.' })
    }
    throw err
  }
}

export async function updateBeneficiary(req, res) {
  await ensureRelationalSchema()
  const {
    firstName,
    lastName,
    cin,
    birthDate,
    sex,
    phone,
    email,
    address,
    commune,
    fokontany,
    householdSize,
    name,
    category,
    contact,
    status,
    notes,
  } = req.body || {}

  const data = {}
  if (firstName !== undefined) data.firstName = String(firstName).trim()
  if (lastName !== undefined) data.lastName = String(lastName).trim()
  if (name !== undefined) {
    data.name = String(name).trim()
  } else if (firstName !== undefined && lastName !== undefined) {
    data.name = `${String(lastName).trim()} ${String(firstName).trim()}`
  }
  if (category !== undefined && String(category) !== 'Emploi') data.category = String(category)
  if (contact !== undefined) data.contact = contact ? String(contact).trim() : null
  if (status !== undefined) data.status = String(status)
  if (sex !== undefined) data.sex = sex === 'F' ? 'F' : 'M'
  if (phone !== undefined) data.phone = phone ? String(phone).trim() : null
  if (email !== undefined) data.email = email ? String(email).trim() : null
  if (address !== undefined) data.address = address ? String(address).trim() : null
  if (commune !== undefined) data.commune = commune ? String(commune).trim() : null
  if (fokontany !== undefined) data.fokontany = fokontany ? String(fokontany).trim() : null
  if (householdSize !== undefined) {
    data.householdSize =
      householdSize !== '' && householdSize !== null ? Math.max(1, Number(householdSize) || 1) : null
  }
  if (notes !== undefined) data.notes = notes ? String(notes).trim() : null
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
  if (cin !== undefined) data.cin = cin && String(cin).trim() ? String(cin).trim() : null

  try {
    const item = await prisma.beneficiary.update({
      where: { id: req.params.id },
      data,
      include: {
        formationEnrollments: {
          include: { formation: { select: { id: true, title: true, session: true, status: true, deletedAt: true } } },
        },
      },
    })
    res.json({ success: true, item: serializeBeneficiary(item) })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Ce numéro CIN existe déjà.' })
    }
    throw err
  }
}

export async function deleteBeneficiary(req, res) {
  await ensureRelationalSchema()
  await prisma.beneficiary.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
