import { prisma } from '../lib/prisma.js'

const FOUNDATIONAL_BUREAU = [
  {
    firstName: 'Brillant',
    lastName: 'BOTOMANANGA',
    sex: 'M',
    role: 'Président du Conseil d’Administration',
    designation: 'Président & Co-fondateur',
    description: 'Porteur stratégique et représentant officiel de l’association REKOMA pour le développement de Midongy Atsimo.',
    displayOrder: 1,
    status: 'active',
  },
  {
    firstName: 'Nanga Miaramanana',
    lastName: 'ANDRIANISAINA',
    sex: 'M',
    role: 'Coordinateur Général & Lead Développeur',
    designation: 'Coordinateur de projets',
    description: 'Pilotage opérationnel du PDIMA, structuration technique et coordination des partenariats socio-économiques.',
    displayOrder: 2,
    status: 'active',
  },
  {
    firstName: 'Nandrianina',
    lastName: 'SANIVOTIANA',
    sex: 'F',
    role: 'Trésorière Générale',
    designation: 'Gestion financière & Budgétaire',
    description: 'Suivi rigoureux de la transparence financière, des dons reçus et des allocations budgétaires du projet PDIMA.',
    displayOrder: 3,
    status: 'active',
  },
  {
    firstName: 'Beriat',
    lastName: 'RAKOTOMALALA',
    sex: 'M',
    role: 'Secrétaire Général',
    designation: 'Administration & Registres',
    description: 'Tenue des procès-verbaux, correspondance institutionnelle et suivi des adhésions communautaires.',
    displayOrder: 4,
    status: 'active',
  },
  {
    firstName: 'Benjamine',
    lastName: 'VANOHARENA',
    sex: 'F',
    role: 'Responsable Communication & Design',
    designation: 'Designer & Valorisation',
    description: 'Identité visuelle de REKOMA, communication auprès des bénéficiaires et sensibilisation locale.',
    displayOrder: 5,
    status: 'active',
  },
  {
    firstName: 'Claude',
    lastName: 'MAUFAZAR',
    sex: 'F',
    role: 'Conseillère Stratégique',
    designation: 'Conseil & Relations Communautaires',
    description: 'Appui consultatif sur les initiatives féminines et l’inclusion des ménages vulnérables de Midongy.',
    displayOrder: 6,
    status: 'active',
  },
  {
    firstName: 'Liva',
    lastName: 'RANDRIAMAMPIANINA',
    sex: 'M',
    role: 'Conseiller Technique',
    designation: 'Conseil & Développement rural',
    description: 'Orientation technique sur les filières avicoles, maraîchères et l’approvisionnement en eau potable.',
    displayOrder: 7,
    status: 'active',
  },
  {
    firstName: 'Tianjara',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Développeur & Support Technique',
    designation: 'Systèmes & Logistique',
    description: 'Maintenance des outils numériques de terrain et appui logistique du centre polyvalent.',
    displayOrder: 8,
    status: 'active',
  },
  {
    firstName: 'Thimote',
    lastName: 'NANGA',
    sex: 'M',
    role: 'Formateur Principal',
    designation: 'Formation & Renforcement des capacités',
    description: 'Animation des ateliers de formation professionnelle, alphabétisation et techniques agropastorales.',
    displayOrder: 9,
    status: 'active',
  },
]

let membersSeededChecked = false

async function ensureFoundationalMembers() {
  if (membersSeededChecked) return
  membersSeededChecked = true
  try {
    // Count all rows including soft-deleted ones so intentional deletions are never re-created
    const totalEver = await prisma.member.count()
    if (totalEver === 0) {
      await prisma.member.createMany({
        data: FOUNDATIONAL_BUREAU,
      })
    }
  } catch (err) {
    console.warn('ensureFoundationalMembers warning:', err?.message)
  }
}

export async function listMembersPublic(req, res) {
  await ensureFoundationalMembers()
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
  await ensureFoundationalMembers()
  const { q, status } = req.query
  const where = { deletedAt: null }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { role: { contains: q, mode: 'insensitive' } },
      { designation: { contains: q, mode: 'insensitive' } },
    ]
  }
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
  await ensureFoundationalMembers()
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
