import { prisma } from '../lib/prisma.js'
import { ensureRelationalSchema } from '../lib/ensureSchema.js'
import PDFDocument from 'pdfkit'

// ---------- News (Actualités) ----------
const NEWS_PAGE_SIZE = 5

export async function listNews(req, res) {
  const { q, published, page } = req.query
  const where = { deletedAt: null }
  if (q) {
    where.OR = [
      { titleFr: { contains: String(q), mode: 'insensitive' } },
      { excerptFr: { contains: String(q), mode: 'insensitive' } },
      { tagFr: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  if (published !== undefined) where.published = String(published) === '1' || String(published) === 'true'
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * NEWS_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.news.findMany({ where, orderBy: { date: 'desc' }, skip, take: NEWS_PAGE_SIZE }),
    prisma.news.count({ where }),
  ])
  res.json({ items, total, page: pageNum, pageSize: NEWS_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) })
}

export async function createNews(req, res) {
  const { titleFr, excerptFr, tagFr, image, published } = req.body || {}
  if (!titleFr || !excerptFr || !tagFr) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' })
  }
  const item = await prisma.news.create({
    data: {
      titleFr: String(titleFr),
      excerptFr: String(excerptFr),
      tagFr: String(tagFr),
      image: image || null,
      published: published !== false,
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateNews(req, res) {
  const { id } = req.params
  const data = req.body || {}
  const item = await prisma.news.update({ where: { id }, data })
  res.json({ success: true, item })
}

export async function deleteNews(req, res) {
  await prisma.news.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

// ---------- Documents ----------
const DOCUMENTS_PAGE_SIZE = 5

export async function listDocuments(req, res) {
  const { q, category, published, page } = req.query
  const where = { deletedAt: null }
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { description: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  if (category) where.category = category
  if (published !== undefined) where.published = String(published) === '1' || String(published) === 'true'
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * DOCUMENTS_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.document.findMany({ where, orderBy: { date: 'desc' }, skip, take: DOCUMENTS_PAGE_SIZE }),
    prisma.document.count({ where }),
  ])
  res.json({ items, total, page: pageNum, pageSize: DOCUMENTS_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / DOCUMENTS_PAGE_SIZE)) })
}

export async function createDocument(req, res) {
  const { title, description, fileUrl, imageUrl, category, published } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.document.create({
    data: {
      title: String(title),
      description: description || null,
      fileUrl: fileUrl || null,
      imageUrl: imageUrl || null,
      category: category || null,
      published: published !== false,
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateDocument(req, res) {
  const item = await prisma.document.update({ where: { id: req.params.id }, data: req.body || {} })
  res.json({ success: true, item })
}

export async function deleteDocument(req, res) {
  await prisma.document.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

// ---------- Gallery (événements + photos) ----------
const GALLERY_PAGE_SIZE = 5

export async function listGallery(req, res) {
  const { q, page } = req.query
  const where = { deletedAt: null }
  if (q) where.title = { contains: String(q), mode: 'insensitive' }
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * GALLERY_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.galleryEvent.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: GALLERY_PAGE_SIZE,
      include: { photos: { where: { event: { deletedAt: null } } } },
    }),
    prisma.galleryEvent.count({ where }),
  ])
  res.json({ items, total, page: pageNum, pageSize: GALLERY_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE)) })
}

export async function createGalleryEvent(req, res) {
  const { title, date, photos } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.galleryEvent.create({
    data: {
      title: String(title),
      date: date ? new Date(date) : undefined,
      photos: {
        create: Array.isArray(photos)
          ? photos.filter((p) => p && p.url).map((p) => ({ url: String(p.url) }))
          : [],
      },
    },
    include: { photos: true },
  })
  res.status(201).json({ success: true, item })
}

export async function addGalleryPhoto(req, res) {
  const { url } = req.body || {}
  if (!url) return res.status(400).json({ success: false, error: 'url requise' })
  const photo = await prisma.galleryPhoto.create({
    data: { url: String(url), eventId: req.params.id },
  })
  res.status(201).json({ success: true, photo })
}

export async function deleteGalleryEvent(req, res) {
  await prisma.galleryEvent.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

// ---------- Activities + Pivot activite_beneficiaire ----------
const ACTIVITIES_PAGE_SIZE = 5

export async function listActivities(req, res) {
  await ensureRelationalSchema()
  const { q, status, page } = req.query
  const where = { deletedAt: null }
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { responsible: { contains: String(q), mode: 'insensitive' } },
      { objectives: { contains: String(q), mode: 'insensitive' } },
      { results: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * ACTIVITIES_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: ACTIVITIES_PAGE_SIZE,
      include: {
        responsibleStaff: { select: { id: true, firstName: true, lastName: true, position: true } },
        beneficiaryLinks: {
          where: { beneficiary: { deletedAt: null } },
          include: {
            beneficiary: { select: { id: true, firstName: true, lastName: true, cin: true, commune: true, category: true } },
          },
        },
      },
    }),
    prisma.activity.count({ where }),
  ])
  res.json({ items, total, page: pageNum, pageSize: ACTIVITIES_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / ACTIVITIES_PAGE_SIZE)) })
}

export async function createActivity(req, res) {
  await ensureRelationalSchema()
  const { title, responsible, responsibleStaffId, date, budget, objectives, participants, results, photos, documents, status } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.activity.create({
    data: {
      title: String(title),
      responsible: responsible || null,
      responsibleStaffId: responsibleStaffId || null,
      date: date ? new Date(date) : undefined,
      budget: Number(budget) || 0,
      objectives: objectives || null,
      participants: Number(participants) || 0,
      results: results || null,
      photos: Array.isArray(photos) ? photos : [],
      documents: Array.isArray(documents) ? documents : [],
      status: status || 'planned',
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateActivity(req, res) {
  await ensureRelationalSchema()
  const body = { ...(req.body || {}) }
  delete body.beneficiaryLinks
  delete body.responsibleStaff
  if (body.date) body.date = new Date(body.date)
  const item = await prisma.activity.update({ where: { id: req.params.id }, data: body })
  res.json({ success: true, item })
}

export async function deleteActivity(req, res) {
  await ensureRelationalSchema()
  await prisma.activity.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

export async function enrollBeneficiaryInActivity(req, res) {
  await ensureRelationalSchema()
  const activityId = req.params.id
  const { beneficiaryId, role, present, notes } = req.body || {}
  if (!beneficiaryId) return res.status(400).json({ success: false, error: 'beneficiaryId requis' })

  const link = await prisma.activityBeneficiary.upsert({
    where: { activityId_beneficiaryId: { activityId, beneficiaryId: String(beneficiaryId) } },
    update: {
      role: role || 'participant',
      present: present !== false,
      notes: notes || null,
    },
    create: {
      activityId,
      beneficiaryId: String(beneficiaryId),
      role: role || 'participant',
      present: present !== false,
      notes: notes || null,
    },
    include: { beneficiary: true },
  })
  const count = await prisma.activityBeneficiary.count({ where: { activityId, beneficiary: { deletedAt: null } } })
  await prisma.activity.update({ where: { id: activityId }, data: { participants: count } }).catch(() => {})
  res.status(201).json({ success: true, item: link })
}

export async function unenrollBeneficiaryFromActivity(req, res) {
  await ensureRelationalSchema()
  const { id: activityId, beneficiaryId } = req.params
  await prisma.activityBeneficiary.deleteMany({ where: { activityId, beneficiaryId } })
  const count = await prisma.activityBeneficiary.count({ where: { activityId, beneficiary: { deletedAt: null } } })
  await prisma.activity.update({ where: { id: activityId }, data: { participants: count } }).catch(() => {})
  res.json({ success: true })
}

// ---------- Formations + Pivot formation_beneficiaire ----------
const FORMATION_PAGE_SIZE = 5

function serializeFormation(f) {
  const enrollments = (f.enrollments || []).filter((e) => e.beneficiary && !e.beneficiary.deletedAt)
  const enrolledCount = enrollments.length
  const presentCount = enrollments.filter(
    (e) => e.attendanceStatus === 'present' || e.attendanceStatus === 'completed'
  ).length
  const scored = enrollments.filter((e) => typeof e.evaluationScore === 'number' && e.evaluationScore > 0)
  const computedEvaluation =
    scored.length > 0
      ? Number((scored.reduce((s, e) => s + Number(e.evaluationScore || 0), 0) / scored.length).toFixed(1))
      : f.evaluation || 0

  const participants = enrolledCount > 0 ? enrolledCount : f.participants || 0
  const attendees = enrolledCount > 0 ? presentCount : f.attendees || 0
  const participationRate =
    participants > 0 ? Math.min(100, Math.round((attendees / participants) * 100)) : 0

  return {
    ...f,
    capacity: f.capacity || 30,
    participants,
    attendees,
    enrolledCount,
    presentCount,
    participationRate,
    evaluation: computedEvaluation,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      formationId: e.formationId,
      beneficiaryId: e.beneficiaryId,
      attendanceStatus: e.attendanceStatus,
      evaluationScore: e.evaluationScore,
      certificateIssued: e.certificateIssued,
      notes: e.notes,
      enrolledAt: e.enrolledAt,
      beneficiary: {
        id: e.beneficiary.id,
        firstName: e.beneficiary.firstName,
        lastName: e.beneficiary.lastName,
        cin: e.beneficiary.cin,
        phone: e.beneficiary.phone,
        commune: e.beneficiary.commune,
        fokontany: e.beneficiary.fokontany,
        category: e.beneficiary.category,
        address: e.beneficiary.address,
        status: e.beneficiary.status,
      },
    })),
    beneficiaries: enrollments.map((e) => ({
      id: e.beneficiary.id,
      enrollmentId: e.id,
      firstName: e.beneficiary.firstName,
      lastName: e.beneficiary.lastName,
      cin: e.beneficiary.cin,
      phone: e.beneficiary.phone,
      commune: e.beneficiary.commune,
      category: e.beneficiary.category,
      address: e.beneficiary.address,
      status: e.beneficiary.status,
      attendanceStatus: e.attendanceStatus,
      attendance: e.attendanceStatus,
      evaluationScore: e.evaluationScore,
      certificateIssued: e.certificateIssued,
      enrolledAt: e.enrolledAt,
    })),
  }
}

async function syncFormationPivotCounters(formationId) {
  const enrollments = await prisma.formationEnrollment.findMany({
    where: { formationId, beneficiary: { deletedAt: null } },
  })
  const enrolledCount = enrollments.length
  const presentCount = enrollments.filter(
    (e) => e.attendanceStatus === 'present' || e.attendanceStatus === 'completed'
  ).length
  const scored = enrollments.filter((e) => typeof e.evaluationScore === 'number' && e.evaluationScore > 0)
  const data = {
    participants: enrolledCount,
    attendees: presentCount,
  }
  if (scored.length > 0) {
    data.evaluation = Number(
      (scored.reduce((s, e) => s + Number(e.evaluationScore || 0), 0) / scored.length).toFixed(1)
    )
  }
  await prisma.formation.update({ where: { id: formationId }, data }).catch(() => {})
}

export async function listFormations(req, res) {
  await ensureRelationalSchema()
  const { q, status, from, to, all } = req.query
  const where = { deletedAt: null }
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { session: { contains: String(q), mode: 'insensitive' } },
      { location: { contains: String(q), mode: 'insensitive' } },
      { trainer: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(String(from))
    if (to) where.date.lte = new Date(String(to))
  }

  const wantAll = String(all) === '1' || String(all) === 'true'
  const page = Math.max(1, Number(req.query.page) || 1)
  const skip = wantAll ? 0 : (page - 1) * FORMATION_PAGE_SIZE
  const take = wantAll ? 200 : FORMATION_PAGE_SIZE

  const [rawItems, total] = await Promise.all([
    prisma.formation.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take,
      include: {
        trainerStaff: { select: { id: true, firstName: true, lastName: true, position: true } },
        enrollments: {
          orderBy: { enrolledAt: 'desc' },
          include: {
            beneficiary: true,
          },
        },
      },
    }),
    prisma.formation.count({ where }),
  ])

  const items = rawItems.map(serializeFormation)
  res.set('Cache-Control', 'no-store')
  res.json({
    items,
    total,
    page,
    pageSize: wantAll ? items.length || FORMATION_PAGE_SIZE : FORMATION_PAGE_SIZE,
    totalPages: wantAll ? 1 : Math.max(1, Math.ceil(total / FORMATION_PAGE_SIZE)),
  })
}

export async function createFormation(req, res) {
  await ensureRelationalSchema()
  const {
    title,
    description,
    session,
    startDate,
    endDate,
    location,
    trainer,
    trainerStaffId,
    date,
    capacity,
    evaluation,
    certificate,
    status,
  } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })

  const created = await prisma.formation.create({
    data: {
      title: String(title).trim(),
      description: description || null,
      session: session || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      location: location || null,
      trainer: trainer || null,
      trainerStaffId: trainerStaffId || null,
      date: date ? new Date(date) : undefined,
      capacity: Math.max(1, Number(capacity) || 30),
      participants: 0,
      attendees: 0,
      evaluation: Number(evaluation) || 0,
      certificate: Boolean(certificate),
      status: status || 'planned',
    },
    include: {
      trainerStaff: { select: { id: true, firstName: true, lastName: true, position: true } },
      enrollments: { include: { beneficiary: true } },
    },
  })
  res.status(201).json({ success: true, item: serializeFormation(created) })
}

export async function updateFormation(req, res) {
  await ensureRelationalSchema()
  const {
    title,
    description,
    session,
    startDate,
    endDate,
    location,
    trainer,
    trainerStaffId,
    date,
    capacity,
    evaluation,
    certificate,
    status,
  } = req.body || {}
  const data = {}
  if (title !== undefined) data.title = String(title).trim()
  if (description !== undefined) data.description = description || null
  if (session !== undefined) data.session = session || null
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
  if (location !== undefined) data.location = location || null
  if (trainer !== undefined) data.trainer = trainer || null
  if (trainerStaffId !== undefined) data.trainerStaffId = trainerStaffId || null
  if (date !== undefined) data.date = date ? new Date(date) : undefined
  if (capacity !== undefined) data.capacity = Math.max(1, Number(capacity) || 30)
  if (evaluation !== undefined) data.evaluation = Number(evaluation) || 0
  if (certificate !== undefined) data.certificate = Boolean(certificate)
  if (status !== undefined) data.status = String(status)

  const updated = await prisma.formation.update({
    where: { id: req.params.id },
    data,
    include: {
      trainerStaff: { select: { id: true, firstName: true, lastName: true, position: true } },
      enrollments: { include: { beneficiary: true } },
    },
  })
  res.json({ success: true, item: serializeFormation(updated) })
}

export async function deleteFormation(req, res) {
  await ensureRelationalSchema()
  try {
    const id = req.params.id
    const existing = await prisma.formation.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Formation introuvable' })
    }
    await prisma.formationEnrollment.deleteMany({ where: { formationId: id } })
    await prisma.formation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    res.set('Cache-Control', 'no-store')
    res.json({ success: true, id })
  } catch (e) {
    console.error('deleteFormation error:', e)
    res.status(500).json({ success: false, error: e.message || 'Erreur suppression formation' })
  }
}

// ---------- Pivot Endpoints: formation_beneficiaire ----------
export async function listFormationEnrollments(req, res) {
  await ensureRelationalSchema()
  const formationId = req.params.id
  const enrollments = await prisma.formationEnrollment.findMany({
    where: { formationId, beneficiary: { deletedAt: null } },
    orderBy: { enrolledAt: 'desc' },
    include: { beneficiary: true },
  })
  res.set('Cache-Control', 'no-store')
  res.json({ items: enrollments, total: enrollments.length })
}

export async function enrollBeneficiaryInFormation(req, res) {
  await ensureRelationalSchema()
  const formationId = req.params.id
  const { beneficiaryId, attendanceStatus, evaluationScore, certificateIssued, notes } = req.body || {}
  if (!beneficiaryId) {
    return res.status(400).json({ success: false, error: 'Veuillez sélectionner un bénéficiaire à inscrire.' })
  }

  const [formation, beneficiary] = await Promise.all([
    prisma.formation.findUnique({ where: { id: formationId } }),
    prisma.beneficiary.findUnique({ where: { id: String(beneficiaryId) } }),
  ])
  if (!formation || formation.deletedAt) {
    return res.status(404).json({ success: false, error: 'Formation introuvable.' })
  }
  if (!beneficiary || beneficiary.deletedAt) {
    return res.status(404).json({ success: false, error: 'Bénéficiaire introuvable.' })
  }

  const enrollment = await prisma.formationEnrollment.upsert({
    where: {
      formationId_beneficiaryId: {
        formationId,
        beneficiaryId: String(beneficiaryId),
      },
    },
    update: {
      attendanceStatus: attendanceStatus || 'enrolled',
      ...(evaluationScore !== undefined ? { evaluationScore: evaluationScore !== null && evaluationScore !== '' ? Number(evaluationScore) : null } : {}),
      ...(certificateIssued !== undefined ? { certificateIssued: Boolean(certificateIssued) } : {}),
      ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
    },
    create: {
      formationId,
      beneficiaryId: String(beneficiaryId),
      attendanceStatus: attendanceStatus || 'enrolled',
      evaluationScore: evaluationScore !== undefined && evaluationScore !== null && evaluationScore !== '' ? Number(evaluationScore) : null,
      certificateIssued: Boolean(certificateIssued),
      notes: notes ? String(notes) : null,
    },
    include: { beneficiary: true },
  })

  await syncFormationPivotCounters(formationId)
  res.status(201).json({ success: true, item: enrollment })
}

export async function updateFormationEnrollment(req, res) {
  await ensureRelationalSchema()
  const { id: formationId, beneficiaryId } = req.params
  const { attendanceStatus, evaluationScore, certificateIssued, notes } = req.body || {}

  const data = {}
  if (attendanceStatus !== undefined) data.attendanceStatus = String(attendanceStatus)
  if (evaluationScore !== undefined) {
    data.evaluationScore = evaluationScore !== null && evaluationScore !== '' ? Number(evaluationScore) : null
  }
  if (certificateIssued !== undefined) data.certificateIssued = Boolean(certificateIssued)
  if (notes !== undefined) data.notes = notes ? String(notes) : null

  const updated = await prisma.formationEnrollment.update({
    where: {
      formationId_beneficiaryId: {
        formationId,
        beneficiaryId,
      },
    },
    data,
    include: { beneficiary: true },
  })

  await syncFormationPivotCounters(formationId)
  res.json({ success: true, item: updated })
}

export async function unenrollBeneficiaryFromFormation(req, res) {
  await ensureRelationalSchema()
  const { id: formationId, beneficiaryId } = req.params
  await prisma.formationEnrollment.deleteMany({
    where: { formationId, beneficiaryId },
  })
  await syncFormationPivotCounters(formationId)
  res.json({ success: true })
}

export async function generateCertificates(req, res) {
  await ensureRelationalSchema()
  const formation = await prisma.formation.findUnique({
    where: { id: req.params.id },
    include: {
      enrollments: {
        where: { beneficiary: { deletedAt: null } },
        include: { beneficiary: true },
      },
    },
  })
  if (!formation) return res.status(404).json({ success: false, error: 'Formation introuvable' })
  if (!formation.certificate) return res.status(400).json({ success: false, error: 'Cette formation ne délivre pas d’attestations.' })

  const eligibleEnrollments = (formation.enrollments || []).filter(
    (e) => e.beneficiary && e.beneficiary.status !== 'inactive' && e.attendanceStatus !== 'absent'
  )
  if (eligibleEnrollments.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun bénéficiaire inscrit éligible dans cette formation.' })
  }

  let sent = false
  const sendJson = (status, payload) => {
    if (sent) return
    sent = true
    res.status(status).json(payload)
  }
  const sendBuffer = (buffer) => {
    if (sent) return
    sent = true
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="attestations-${formation.id}.pdf"`)
    res.send(buffer)
  }

  try {
    await prisma.formationEnrollment.updateMany({
      where: { id: { in: eligibleEnrollments.map((e) => e.id) } },
      data: { certificateIssued: true },
    }).catch(() => {})

    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => sendBuffer(Buffer.concat(chunks)))
    doc.on('error', (err) => {
      console.error('PDF generation error:', err)
      sendJson(500, { success: false, error: 'Erreur lors de la génération du PDF' })
    })

    const orgName = 'REKOMA'
    const issuedAt = new Date().toLocaleDateString('fr-FR')

    for (let i = 0; i < eligibleEnrollments.length; i++) {
      const b = eligibleEnrollments[i].beneficiary
      if (i > 0) doc.addPage()

      doc.font('Helvetica-Bold').fontSize(22).text(orgName, { align: 'center' })
      doc.moveDown(0.5)
      doc.font('Helvetica').fontSize(14).text('Attestation de participation', { align: 'center' })
      doc.moveDown(1.5)

      doc.font('Helvetica').fontSize(12)
      doc.text(`Bénéficiaire : ${b.firstName || ''} ${b.lastName || ''}`)
      if (b.cin) doc.text(`CIN : ${b.cin}`)
      if (b.commune) doc.text(`Commune : ${b.commune}`)
      doc.text(`Formation : ${formation.title}`)
      if (formation.session) doc.text(`Session : ${formation.session}`)
      if (formation.startDate || formation.endDate) {
        const start = formation.startDate ? new Date(formation.startDate).toLocaleDateString('fr-FR') : null
        const end = formation.endDate ? new Date(formation.endDate).toLocaleDateString('fr-FR') : null
        doc.text(`Période : ${start ? start : '...'} - ${end ? end : '...'}`)
      }
      if (formation.location) doc.text(`Lieu : ${formation.location}`)
      if (formation.trainer) doc.text(`Formateur : ${formation.trainer}`)
      doc.moveDown(1)
      doc.text('Ce document atteste que le bénéficiaire inscrit a régulièrement participé à la formation ci-dessus.')
      doc.moveDown(1.5)
      doc.text(`Date d'émission : ${issuedAt}`)
      doc.moveDown(3)
      doc.text('Signature :', { continued: false })
      doc.moveDown(4)
      doc.text('Cachet :', { continued: false })
    }

    doc.end()
  } catch (err) {
    console.error('generateCertificates failed:', err)
    sendJson(500, { success: false, error: 'Erreur lors de la génération du PDF' })
  }
}
