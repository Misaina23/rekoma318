import { prisma } from '../lib/prisma.js'

// ---------- News (Actualités) ----------
export async function listNews(req, res) {
  const publishedOnly = req.query.all !== '1'
  const items = await prisma.news.findMany({
    where: { ...(publishedOnly ? { published: true } : {}), deletedAt: null },
    orderBy: { date: 'desc' },
  })
  res.json(items)
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
export async function listDocuments(req, res) {
  const publishedOnly = req.query.all !== '1'
  const items = await prisma.document.findMany({
    where: { ...(publishedOnly ? { published: true } : {}), deletedAt: null },
    orderBy: { date: 'desc' },
  })
  res.json(items)
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
export async function listGallery(req, res) {
  const events = await prisma.galleryEvent.findMany({
    where: { deletedAt: null },
    orderBy: { date: 'desc' },
    include: { photos: { where: { event: { deletedAt: null } } } },
  })
  res.json(events)
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
export async function listActivities(req, res) {
  const items = await prisma.activity.findMany({ where: { deletedAt: null }, orderBy: { date: 'desc' } })
  res.json(items)
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
export async function listFormations(req, res) {
  const items = await prisma.formation.findMany({ where: { deletedAt: null }, orderBy: { date: 'desc' } })
  res.json(items)
}

export async function createFormation(req, res) {
  const { title, session, date, participants, attendees, evaluation, certificate, status } = req.body || {}
  if (!title) return res.status(400).json({ success: false, error: 'Titre requis' })
  const item = await prisma.formation.create({
    data: {
      title: String(title),
      session: session || null,
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
  const item = await prisma.formation.update({ where: { id: req.params.id }, data: req.body || {} })
  res.json({ success: true, item })
}

export async function deleteFormation(req, res) {
  await prisma.formation.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}
