import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { ensureRelationalSchema } from '../lib/ensureSchema.js'
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
  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL || 'botomznanga@gmail.com',
    subject: `Nouveau message de ${name}`,
    html: `<p><strong>De :</strong> ${name} &lt;${email}&gt;</p><p><strong>Sujet :</strong> ${subject || '(sans objet)'}</p><p>${message}</p>`,
    text: `De : ${name} <${email}>\nMessage : ${message}`,
  }).catch(() => {})
  res.status(201).json({ success: true, id: item.id })
}

export async function listMessagesGrouped(req, res) {
  const messages = await prisma.message.findMany({
    where: { deletedAt: null },
    orderBy: [{ createdAt: 'desc' }],
    include: { replies: { orderBy: { at: 'asc' } } },
  })
  res.json(messages)
}

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

// ---------- Dynamic Persistent Visits & Connections ----------
function buildLast14Days() {
  const out = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(now.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export async function postVisit(req, res) {
  await ensureRelationalSchema()
  const day = new Date().toISOString().slice(0, 10)
  const rawPath = String(req.body?.path || '/').slice(0, 160)
  const isAdmin = Boolean(req.body?.isAdmin) || rawPath.startsWith('/admin')
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon')
    .split(',')[0]
    .trim()
  const ua = String(req.headers['user-agent'] || '').slice(0, 120)
  const clientVisitorId = req.body?.visitorId ? String(req.body.visitorId).slice(0, 80) : null
  const visitorHash =
    clientVisitorId ||
    crypto.createHash('sha256').update(`${ip}|${ua}|${day}`).digest('hex').slice(0, 24)

  await prisma.siteVisit
    .create({
      data: {
        day,
        path: rawPath || '/',
        visitorHash,
        isAdmin,
      },
    })
    .catch((e) => console.warn('[visits] insert warning:', e.message))

  res.json({ success: true, day })
}

export async function getVisits(req, res) {
  await ensureRelationalSchema()
  const today = new Date().toISOString().slice(0, 10)
  const last14 = buildLast14Days()
  const minDay = last14[0]

  const [totalPublic, todayPublic, totalAdmin, todayAdmin, byDayGroup, byPathGroup, uniqueGroup] =
    await Promise.all([
      prisma.siteVisit.count({ where: { isAdmin: false } }),
      prisma.siteVisit.count({ where: { isAdmin: false, day: today } }),
      prisma.siteVisit.count({ where: { isAdmin: true } }),
      prisma.siteVisit.count({ where: { isAdmin: true, day: today } }),
      prisma.siteVisit.groupBy({
        by: ['day'],
        where: { isAdmin: false, day: { gte: minDay } },
        _count: { _all: true },
      }),
      prisma.siteVisit.groupBy({
        by: ['path'],
        where: { isAdmin: false },
        _count: { _all: true },
        orderBy: { _count: { path: 'desc' } },
        take: 6,
      }),
      prisma.siteVisit.groupBy({
        by: ['visitorHash'],
        where: { isAdmin: false, visitorHash: { not: null } },
      }),
    ])

  const days = {}
  for (const d of last14) days[d] = 0
  for (const row of byDayGroup) {
    if (row.day) days[row.day] = row._count._all
  }

  const topPages = byPathGroup.map((row) => ({
    path: row.path || '/',
    views: row._count._all,
  }))

  res.set('Cache-Control', 'no-store')
  res.json({
    total: totalPublic,
    uniqueVisitors: uniqueGroup.length || totalPublic,
    today: todayPublic,
    adminConnections: totalAdmin,
    adminConnectionsToday: todayAdmin,
    days,
    topPages,
  })
}

export async function publicStats(req, res) {
  await ensureRelationalSchema()
  const [members, donations, formations, beneficiariesCount] = await Promise.all([
    prisma.member.findMany({ where: { deletedAt: null } }).catch(() => []),
    prisma.donation.findMany({ where: { status: 'validated', deletedAt: null } }).catch(() => []),
    prisma.formation.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.beneficiary.count({ where: { deletedAt: null } }).catch(() => 0),
  ])
  const activeMembers = Array.isArray(members) ? members.length : 0
  const validatedDonations = Array.isArray(donations) ? donations.length : 0
  res.json({
    activeMembers,
    formations,
    validatedDonations,
    beneficiaries: beneficiariesCount,
  })
}

export async function dashboardStats(req, res) {
  await ensureRelationalSchema()
  const today = new Date().toISOString().slice(0, 10)

  const [
    visitorsTotal,
    visitorsToday,
    adminLoginsFromTokens,
    adminVisitsCount,
    beneficiariesTotal,
    beneficiariesActive,
    beneficiariesByCategory,
    formationsList,
    enrollmentsList,
    staffList,
    membersActive,
    activitiesTotal,
    donationsValidated,
    ordersList,
    messagesList,
  ] = await Promise.all([
    prisma.siteVisit.count({ where: { isAdmin: false } }).catch(() => 0),
    prisma.siteVisit.count({ where: { isAdmin: false, day: today } }).catch(() => 0),
    prisma.refreshToken.count().catch(() => 0),
    prisma.siteVisit.count({ where: { isAdmin: true } }).catch(() => 0),
    prisma.beneficiary.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.beneficiary.count({ where: { deletedAt: null, status: 'active' } }).catch(() => 0),
    prisma.beneficiary
      .groupBy({ by: ['category'], where: { deletedAt: null }, _count: { _all: true } })
      .catch(() => []),
    prisma.formation.findMany({ where: { deletedAt: null } }).catch(() => []),
    prisma.formationEnrollment
      .findMany({ where: { beneficiary: { deletedAt: null }, formation: { deletedAt: null } } })
      .catch(() => []),
    prisma.staff
      .findMany({ where: { deletedAt: null }, include: { contracts: true } })
      .catch(() => []),
    prisma.member.count({ where: { deletedAt: null, status: 'active' } }).catch(() => 0),
    prisma.activity.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.donation.findMany({ where: { deletedAt: null, status: 'validated' } }).catch(() => []),
    prisma.storeOrder.findMany().catch(() => []),
    prisma.message.findMany({ where: { deletedAt: null } }).catch(() => []),
  ])

  const activeFormations = formationsList.filter((f) => f.status === 'ongoing' || f.status === 'planned').length
  const completedFormations = formationsList.filter((f) => f.status === 'done').length
  const totalEnrollments = enrollmentsList.length
  const presentEnrollments = enrollmentsList.filter(
    (e) => e.attendanceStatus === 'present' || e.attendanceStatus === 'completed'
  ).length
  const fallbackParticipants = formationsList.reduce((s, f) => s + (Number(f.participants) || 0), 0)
  const fallbackAttendees = formationsList.reduce((s, f) => s + (Number(f.attendees) || 0), 0)
  const participationRate =
    totalEnrollments > 0
      ? Math.round((presentEnrollments / totalEnrollments) * 100)
      : fallbackParticipants > 0
        ? Math.min(100, Math.round((fallbackAttendees / fallbackParticipants) * 100))
        : 0

  const activeStaff = staffList.filter((s) => s.status === 'active').length
  const contractsBreakdown = { CDI: 0, CDD: 0, Stage: 0, Consultant: 0, Prestation: 0 }
  let monthlyPayroll = 0
  for (const s of staffList) {
    const c = (s.contracts || []).find((x) => x.status === 'active') || s.contracts?.[0]
    if (c) {
      contractsBreakdown[c.contractType] = (contractsBreakdown[c.contractType] || 0) + 1
      if (s.status === 'active' && c.status === 'active') {
        monthlyPayroll += Number(c.salary) || 0
      }
    }
  }

  const donationsCollected = donationsValidated.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const storeRevenue = ordersList
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (Number(o.total) || 0), 0)

  const beneficiarySectors = {}
  for (const row of beneficiariesByCategory) {
    if (row.category && row.category !== 'Emploi') {
      beneficiarySectors[row.category] = row._count._all
    }
  }

  res.set('Cache-Control', 'no-store')
  res.json({
    visitors: visitorsTotal,
    visitorsToday,
    adminConnections: Math.max(adminLoginsFromTokens, adminVisitsCount),
    beneficiariesTotal,
    beneficiariesActive,
    beneficiarySectors,
    formations: formationsList.length,
    activeFormations,
    completedFormations,
    totalEnrollments,
    presentEnrollments,
    participationRate,
    personnelTotal: staffList.length,
    personnelActive: activeStaff,
    contractsBreakdown,
    monthlyPayroll,
    activeMembers: membersActive,
    activities: activitiesTotal,
    donations: donationsValidated.length,
    donationsCollected,
    ordersTotal: ordersList.length,
    ordersPending: ordersList.filter((o) => o.status === 'pending').length,
    storeRevenue,
    messages: messagesList.length,
    unread: messagesList.filter((m) => !m.read && !m.archived).length,
    day: today,
  })
}

export async function notifyAdminLogin(req, res) {
  await ensureRelationalSchema()
  const day = new Date().toISOString().slice(0, 10)
  await prisma.siteVisit
    .create({
      data: {
        day,
        path: '/admin/login',
        visitorHash: req.body?.email ? String(req.body.email).slice(0, 80) : 'admin',
        isAdmin: true,
      },
    })
    .catch(() => {})
  res.json({ success: true })
}
