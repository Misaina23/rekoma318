import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { sendEmail } from '../utils/mail.js'

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

function randomCode() {
  return String(crypto.randomInt(100000, 999999))
}

// ---------- 2FA (code par email) ----------
export async function request2FA(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ success: false, error: 'Email requis' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ success: false, error: 'Compte introuvable' })

  // rate-limit: block if too many attempts recently
  const recent = await prisma.twoFactorToken.count({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
  })
  if (recent >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const code = randomCode()
  await prisma.twoFactorToken.create({
    data: { userId: user.id, code, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  })
  await sendEmail({
    to: email,
    subject: 'Votre code de vérification REKOMA',
    html: `<p>Votre code de vérification à 2 facteurs est : <strong>${code}</strong></p><p>Il expire dans 10 minutes.</p>`,
    text: `Votre code de vérification REKOMA : ${code} (expire dans 10 minutes).`,
  }).catch(() => {})

  res.json({ success: true, message: 'Code envoyé par email' })
}

export async function verify2FA(req, res) {
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ success: false, error: 'Email et code requis' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ success: false, error: 'Invalide' })

  const token = await prisma.twoFactorToken.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) return res.status(401).json({ success: false, error: 'Code expiré ou introuvable' })
  if (token.attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Trop de tentatives' })
  }
  if (token.code !== String(code)) {
    await prisma.twoFactorToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } })
    return res.status(401).json({ success: false, error: 'Code incorrect' })
  }
  await prisma.twoFactorToken.update({ where: { id: token.id }, data: { used: true } })
  res.json({ success: true, verified: true })
}

// ---------- Email verification (inscription) ----------
export async function requestEmailVerification(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ success: false, error: 'Email requis' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ success: false, error: 'Email déjà utilisé' })

  const token = crypto.randomUUID()
  await prisma.emailVerification.upsert({
    where: { email },
    update: { token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verified: false },
    create: { email, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })
  const link = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/verify-email?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Vérifiez votre adresse email REKOMA',
    html: `<p>Cliquez pour vérifier votre email :</p><p><a href="${link}">${link}</a></p>`,
    text: `Vérifiez votre email : ${link}`,
  }).catch(() => {})

  res.json({ success: true, message: 'Email de vérification envoyé' })
}

export async function confirmEmailVerification(req, res) {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ success: false, error: 'Token requis' })
  const record = await prisma.emailVerification.findUnique({ where: { token } })
  if (!record) return res.status(404).json({ success: false, error: 'Token invalide' })
  if (record.verified) return res.json({ success: true, verified: true })
  if (record.expiresAt < new Date()) return res.status(410).json({ success: false, error: 'Token expiré' })
  await prisma.emailVerification.update({ where: { token }, data: { verified: true } })
  res.json({ success: true, verified: true })
}
