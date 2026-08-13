import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { emailVerificationEmail, twoFactorEmail } from '../utils/mail.js'
import { createAccessToken, createRefreshTokenValue } from './authController.js'

const CODE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

function randomCode() {
  return String(crypto.randomInt(100000, 999999))
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function request2FA(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email et mot de passe requis' })
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) return res.status(404).json({ success: false, error: 'Compte introuvable' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' })
  if (!user.twoFactorEnabled) return res.status(400).json({ success: false, error: '2FA non activé pour ce compte' })
  if (user.active === false) return res.status(403).json({ success: false, error: 'Compte désactivé' })

  const recent = await prisma.twoFactorToken.count({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
  })
  if (recent >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const code = randomCode()
  const sessionId = crypto.randomUUID()
  const codeHash = hashCode(code)

  await prisma.twoFactorToken.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      sessionId,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })

  await twoFactorEmail(normalizedEmail, code)

  res.json({ success: true, sessionId, message: 'Code envoyé par email' })
}

export async function resend2FA(req, res) {
  const { sessionId } = req.body || {}
  if (!sessionId) return res.status(400).json({ success: false, error: 'Session requise' })

  const token = await prisma.twoFactorToken.findFirst({
    where: { sessionId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) return res.status(404).json({ success: false, error: 'Session expirée' })

  const user = await prisma.user.findUnique({ where: { id: token.userId } })
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })

  const recent = await prisma.twoFactorToken.count({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() }, id: { not: token.id } },
  })
  if (recent >= MAX_ATTEMPTS) {
    return res.status(429).json({ success: false, error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  await prisma.twoFactorToken.update({ where: { id: token.id }, data: { used: true } })

  const newCode = randomCode()
  const newSessionId = crypto.randomUUID()
  const newCodeHash = hashCode(newCode)

  await prisma.twoFactorToken.create({
    data: {
      userId: user.id,
      email: user.email,
      sessionId: newSessionId,
      codeHash: newCodeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })

  await twoFactorEmail(user.email, newCode)

  res.json({ success: true, sessionId: newSessionId, message: 'Code renvoyé' })
}

export async function verify2FA(req, res) {
  const { sessionId, code } = req.body || {}
  if (!sessionId || !code) return res.status(400).json({ success: false, error: 'Session et code requis' })

  const codeHash = hashCode(String(code))

  const token = await prisma.twoFactorToken.findFirst({
    where: {
      sessionId,
      used: false,
      expiresAt: { gt: new Date() },
      codeHash,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!token) {
    const wrongToken = await prisma.twoFactorToken.findFirst({
      where: { sessionId, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (wrongToken) {
      await prisma.twoFactorToken.update({
        where: { id: wrongToken.id },
        data: { attempts: { increment: 1 } },
      })
    }
    return res.status(401).json({ success: false, error: 'Code incorrect ou expiré' })
  }

  const user = await prisma.user.findUnique({ where: { id: token.userId } })
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })

  await prisma.twoFactorToken.update({ where: { id: token.id }, data: { used: true } })

  const accessToken = createAccessToken(user)
  const refreshTokenValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({ data: { token: refreshTokenValue, userId: user.id, expiresAt } })
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const isProd = process.env.NODE_ENV === 'production'
  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    path: '/',
  }

  res.cookie('refreshToken', refreshTokenValue, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 })
  res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 })

  res.json({
    success: true,
    verified: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  })
}

// ---------- Email verification ----------
export async function requestEmailVerification(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ success: false, error: 'Email requis' })
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, error: 'Format email invalide' })

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing?.emailVerified) return res.status(409).json({ success: false, error: 'Email déjà vérifié' })

  const token = crypto.randomUUID()
  await prisma.emailVerification.upsert({
    where: { email: normalizedEmail },
    update: { token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), verified: false },
    create: { email: normalizedEmail, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })
  const link = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/verify-email?token=${token}`
  await emailVerificationEmail(normalizedEmail, link)

  res.json({ success: true, message: 'Email de vérification envoyé' })
}

export async function confirmEmailVerification(req, res) {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ success: false, error: 'Token requis' })
  const record = await prisma.emailVerification.findUnique({ where: { token } })
  if (!record) return res.status(404).json({ success: false, error: 'Token invalide' })
  if (record.verified) return res.json({ success: true, verified: true })
  if (record.expiresAt < new Date()) return res.status(410).json({ success: false, error: 'Token expiré' })

  await prisma.$transaction([
    prisma.emailVerification.update({ where: { token }, data: { verified: true } }),
    prisma.user.update({ where: { email: record.email }, data: { emailVerified: true } }),
  ])
  res.json({ success: true, verified: true })
}
