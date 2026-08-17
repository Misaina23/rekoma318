import { prisma } from '../lib/prisma.js'
import PDFDocument from 'pdfkit'

// ---------- News (Actualités) ----------
const NEWS_PAGE_SIZE = 4

export async function listNews(req, res) {
  const { q, published, page } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [
    { titleFr: { contains: String(q), mode: 'insensitive' } },
    { excerptFr: { contains: String(q), mode: 'insensitive' } },
    { tagFr: { contains: String(q), mode: 'insensitive' } },
  ]
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
const DOCUMENTS_PAGE_SIZE = 4

export async function listDocuments(req, res) {
  const { q, category, published, page } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [
    { title: { contains: String(q), mode: 'insensitive' } },
    { description: { contains: String(q), mode: 'insensitive' } },
  ]
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
const GALLERY_PAGE_SIZE = 4

export async function listGallery(req, res) {
  const { q, page } = req.query
  const where = { deletedAt: null }
  if (q) where.title = { contains: String(q), mode: 'insensitive' }
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * GALLERY_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.galleryEvent.findMany({ where, orderBy: { date: 'desc' }, skip, take: GALLERY_PAGE_SIZE, include: { photos: { where: { event: { deletedAt: null } } } } }),
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

// ---------- Activities ----------
const ACTIVITIES_PAGE_SIZE = 4

export async function listActivities(req, res) {
  const { q, status, page } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [
    { title: { contains: String(q), mode: 'insensitive' } },
    { responsible: { contains: String(q), mode: 'insensitive' } },
    { objectives: { contains: String(q), mode: 'insensitive' } },
    { results: { contains: String(q), mode: 'insensitive' } },
  ]
  if (status) where.status = status
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = (pageNum - 1) * ACTIVITIES_PAGE_SIZE
  const [items, total] = await Promise.all([
    prisma.activity.findMany({ where, orderBy: { date: 'desc' }, skip, take: ACTIVITIES_PAGE_SIZE }),
    prisma.activity.count({ where }),
  ])
  res.json({ items, total, page: pageNum, pageSize: ACTIVITIES_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / ACTIVITIES_PAGE_SIZE)) })
}

export async function createActivity(req, res) {
  const { title, responsible, date, budget, objectives, participants, results, photos, documents, status } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.activity.create({
    data: {
      title: String(title),
      responsible: responsible || null,
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
  const item = await prisma.activity.update({ where: { id: req.params.id }, data: req.body || {} })
  res.json({ success: true, item })
}

export async function deleteActivity(req, res) {
  await prisma.activity.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

// ---------- Formations ----------
const FORMATION_PAGE_SIZE = 4

export async function listFormations(req, res) {
  const { q, status, from, to } = req.query
  const where = { deletedAt: null }
  if (q) where.OR = [{ title: { contains: String(q), mode: 'insensitive' } }, { session: { contains: String(q), mode: 'insensitive' } }, { location: { contains: String(q), mode: 'insensitive' } }, { trainer: { contains: String(q), mode: 'insensitive' } }]
  if (status) where.status = status
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(String(from))
    if (to) where.date.lte = new Date(String(to))
  }

  const page = Math.max(1, Number(req.query.page) || 1)
  const skip = (page - 1) * FORMATION_PAGE_SIZE

  const [items, total] = await Promise.all([
    prisma.formation.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: FORMATION_PAGE_SIZE,
      include: { beneficiaries: { select: { id: true, firstName: true, lastName: true, cin: true, phone: true, address: true, status: true, attendance: true } } },
    }),
    prisma.formation.count({ where }),
  ])

  res.json({ items, total, page, pageSize: FORMATION_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / FORMATION_PAGE_SIZE)) })
}

export async function createFormation(req, res) {
  const { title, description, session, startDate, endDate, location, trainer, date, participants, attendees, evaluation, certificate, status } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.formation.create({
    data: {
      title: String(title),
      description: description || null,
      session: session || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      location: location || null,
      trainer: trainer || null,
      date: date ? new Date(date) : undefined,
      participants: Number(participants) || 0,
      attendees: Number(attendees) || 0,
      evaluation: Number(evaluation) || 0,
      certificate: Boolean(certificate),
      status: status || 'planned',
    },
  })
  res.status(201).json({ success: true, item })
}

export async function updateFormation(req, res) {
  const { title, description, session, startDate, endDate, location, trainer, date, participants, attendees, evaluation, certificate, status } = req.body || {}
  const data = {}
  if (title !== undefined) data.title = String(title)
  if (description !== undefined) data.description = description || null
  if (session !== undefined) data.session = session || null
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
  if (location !== undefined) data.location = location || null
  if (trainer !== undefined) data.trainer = trainer || null
  if (date !== undefined) data.date = date ? new Date(date) : undefined
  if (participants !== undefined) data.participants = Number(participants) || 0
  if (attendees !== undefined) data.attendees = Number(attendees) || 0
  if (evaluation !== undefined) data.evaluation = Number(evaluation) || 0
  if (certificate !== undefined) data.certificate = Boolean(certificate)
  if (status !== undefined) data.status = String(status)
  const item = await prisma.formation.update({ where: { id: req.params.id }, data })
  res.json({ success: true, item })
}

export async function deleteFormation(req, res) {
  await prisma.formation.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

export async function generateCertificates(req, res) {
  const formation = await prisma.formation.findUnique({
    where: { id: req.params.id },
    include: { beneficiaries: { where: { deletedAt: null } } },
  })
  if (!formation) return res.status(404).json({ success: false, error: 'Formation introuvable' })
  if (!formation.certificate) return res.status(400).json({ success: false, error: 'Cette formation ne délivre pas d’attestations.' })

  const beneficiaries = (formation.beneficiaries || []).filter((b) => b.status !== 'inactive')
  if (beneficiaries.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun bénéficiaire actif dans cette formation.' })
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
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => sendBuffer(Buffer.concat(chunks)))
    doc.on('error', (err) => {
      console.error('PDF generation error:', err)
      sendJson(500, { success: false, error: 'Erreur lors de la génération du PDF' })
    })

    const orgName = 'REKOMA'
    const issuedAt = new Date().toLocaleDateString('fr-FR')

    for (let i = 0; i < beneficiaries.length; i++) {
      const b = beneficiaries[i]
      if (i > 0) doc.addPage()

      doc.font('Helvetica-Bold').fontSize(22).text(orgName, { align: 'center' })
      doc.moveDown(0.5)
      doc.font('Helvetica').fontSize(14).text('Attestation de participation', { align: 'center' })
      doc.moveDown(1.5)

      doc.font('Helvetica').fontSize(12)
      doc.text(`Bénéficiaire : ${b.firstName || ''} ${b.lastName || ''}`)
      if (b.cin) doc.text(`CIN : ${b.cin}`)
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
      doc.text('Ce document atteste que le bénéficiaire a participé à la formation ci-dessus.')
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


