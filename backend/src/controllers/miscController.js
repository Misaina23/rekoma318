import { prisma } from '../lib/prisma.js'
import { sendEmail } from '../utils/mail.js'

// ---------- Messages (vitrine -> admin) ----------
export async function postMessage(req, res) {
  const { name, email, phone, subject, message } = req.body || {}
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Champs requis manquants' })
  }
  const item = await prisma.message.create({
    data: {
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 40) : null,
      subject: subject ? String(subject).slice(0, 200) : null,
      body: String(message).slice(0, 8000),
    },
  })
  // notify admin
  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL || 'botomznanga@gmail.com',
    subject: `Nouveau message de ${name}`,
    html: `<p><strong>De :</strong> ${name} &lt;${email}&gt;</p><p><strong>Sujet :</strong> ${subject || '(sans objet)'}</p><p>${message}</p>`,
    text: `De : ${name} <${email}>\nMessage : ${message}`,
  }).catch(() => {})
  res.status(201).json({ success: true, id: item.id })
}

// Individual messages (admin)
export async function listMessagesGrouped(req, res) {
  const messages = await prisma.message.findMany({
    where: { deletedAt: null },
    orderBy: [{ createdAt: 'desc' }],
    include: { replies: { orderBy: { at: 'asc' } } },
  })
  res.json(messages)
}

// Single message update (read/archived/replies)
export async function updateMessage(req, res) {
  const { id } = req.params
  const data = {}
  if (req.body.read !== undefined) data.read = Boolean(req.body.read)
  if (req.body.archived !== undefined) data.archived = Boolean(req.body.archived)
  if (Array.isArray(req.body.replies)) {
    for (const r of req.body.replies) {
      if (!r || !r.body) continue
      await prisma.reply.create({
        data: { messageId: id, from: String(r.from || 'REKOMA').slice(0, 120), body: String(r.body).slice(0, 8000) },
      })
    }
  }
  const item = await prisma.message.update({ where: { id }, data })
  res.json({ success: true, item })
}

export async function deleteMessage(req, res) {
  await prisma.message.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
  res.json({ success: true })
}

// Admin reply -> persists + sends real email
export async function replyMessage(req, res) {
  const { id } = req.params
  const { from, body } = req.body || {}
  if (!body) return res.status(400).json({ success: false, error: 'Corps de réponse requis' })
  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) return res.status(404).json({ success: false, error: 'Message introuvable' })

  const reply = await prisma.reply.create({
    data: { messageId: id, from: String(from || 'REKOMA').slice(0, 120), body: String(body).slice(0, 8000) },
  })

  let emailResult = { success: false, error: 'not_sent' }
  try {
    emailResult = await sendEmail({
      to: message.email,
      subject: `RE: ${message.subject || 'Votre message à REKOMA'}`,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
      text: body,
    })
  } catch (e) {
    emailResult = { success: false, error: String(e?.message || e) }
  }

  res.json({ success: true, reply, email: emailResult })
}

// ---------- Visits ----------
export async function postVisit(req, res) {
  res.json({ success: true })
}

export async function publicStats(req, res) {
  const [ben, byCategory, members, donations, formations] = await Promise.all([
    prisma.beneficiary.count({ where: { deletedAt: null } }),
    prisma.beneficiary.groupBy({ by: ['category'], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.member.findMany({ where: { deletedAt: null } }).catch(() => []),
    prisma.donation.findMany({ where: { status: 'validated' } }).catch(() => []),
    prisma.formation.count().catch(() => 0),
  ])
  const breakdown = byCategory.reduce((acc, g) => {
    acc[g.category] = g._count._all
    return acc
  }, {})
  for (const c of ['Distribution', 'Emploi', 'Formation', 'Autre']) {
    if (!(c in breakdown)) breakdown[c] = 0
  }
  const activeMembers = Array.isArray(members) ? members.length : 0
  const validatedDonations = Array.isArray(donations) ? donations.length : 0
  res.json({
    beneficiaries: ben,
    breakdown,
    activeMembers,
    formations,
    validatedDonations,
  })
}

// ---------- Admin login notify (kept for compatibility) ----------
export async function notifyAdminLogin(req, res) {
  console.log('Admin login notify:', req.body)
  res.json({ success: true })
}
