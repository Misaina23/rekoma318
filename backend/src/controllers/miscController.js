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

  const emailRes = await sendEmail({
    to: message.email,
    subject: `RE: ${message.subject || 'Votre message à REKOMA'}`,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    text: body,
  }).catch((e) => ({ success: false, error: String(e) }))

  res.json({ success: true, reply, email: emailRes })
}

// ---------- Visits ----------
export async function postVisit(req, res) {
  // Visits are tracked client-side / analytics; keep lightweight counter in DB optional.
  res.json({ success: true })
}

// ---------- Admin login notify (kept for compatibility) ----------
export async function notifyAdminLogin(req, res) {
  console.log('Admin login notify:', req.body)
  res.json({ success: true })
}
