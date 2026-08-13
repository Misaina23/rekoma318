import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { welcomeEmail, passwordResetEmail, emailVerificationEmail } from '../utils/mail.js'
import { rateLimit } from '../middleware/rateLimiter.js'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET?.trim()
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables')
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const MAX_RESET_ATTEMPTS = 3

function createAccessToken(user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' })
}

function createRefreshTokenValue() {
  return crypto.randomUUID?.() ?? crypto.randomBytes(32).toString('hex')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function register(req, res) {
  const { email, password, name, role } = req.body
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return res.status(400).json({ success: false, error: 'Email requis' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, error: 'Format email invalide' })

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) return res.status(409).json({ success: false, error: 'Email déjà utilisé' })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: name || null,
      role: role || 'viewer',
      emailVerified: false,
    },
  })

  await welcomeEmail(name || normalizedEmail, normalizedEmail)

  const token = crypto.randomUUID()
  await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  const link = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/verify-email?token=${token}`
  await emailVerificationEmail(normalizedEmail, link).catch((e) => console.error('verification email failed:', e.message))

  res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  })
}

export async function forgotPassword(req, res) {
  const { email } = req.body
  const normalizedEmail = String(email || '').trim().toLowerCase()

  const rateKey = `forgot:${normalizedEmail}`
  const rl = rateLimit(rateKey)
  if (!rl.allowed) {
    return res.status(429).json({ success: false, error: 'Trop de tentatives. Réessayez plus tard.' })
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (user) {
    const rawToken = crypto.randomUUID()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    })

    const resetLink = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/admin/reset-password?token=${rawToken}`
    await passwordResetEmail(normalizedEmail, resetLink)
  }

  res.json({ success: true, message: 'Si cette adresse existe, un e-mail de réinitialisation a été envoyé.' })
}

export async function resetPassword(req, res) {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ success: false, error: 'Token et mot de passe requis' })

  const tokenHash = hashToken(token)
  const record = await prisma.passwordReset.findFirst({
    where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) return res.status(400).json({ success: false, error: 'Token invalide ou expiré' })

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
  await prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } })

  res.json({ success: true, message: 'Mot de passe réinitialisé' })
}

export async function login(req, res) {
  const { email, password } = req.body
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' })
  if (user.active === false) return res.status(403).json({ success: false, error: 'Compte désactivé' })
  if (emailVerifiedEnabled && !user.emailVerified) return res.status(403).json({ success: false, error: 'Email non vérifié. Vérifiez votre adresse email avant de vous connecter.' })

  if (user.twoFactorEnabled) {
    return res.json({ success: true, requiresTwoFactor: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  }

  const accessToken = createAccessToken(user)
  const refreshTokenValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({ data: { token: refreshTokenValue, userId: user.id, expiresAt } })
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
  res.cookie('refreshToken', refreshTokenValue, cookieOpts)
  const accessCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000,
  }
  res.cookie('accessToken', accessToken, accessCookieOpts)
  res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
}

export async function refreshToken(req, res) {
  const rt = req.cookies?.refreshToken
  if (!rt) return res.status(401).json({ success: false, error: 'No refresh token' })

  const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: rt }, include: { user: true } })
  if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' })
  }

  const newRtValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true } })
  await prisma.refreshToken.create({ data: { token: newRtValue, userId: tokenRecord.userId, expiresAt } })

  const accessToken = createAccessToken(tokenRecord.user)
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
  res.cookie('refreshToken', newRtValue, cookieOpts)
  const accessCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000,
  }
  res.cookie('accessToken', accessToken, accessCookieOpts)
  res.json({ success: true })
}

export async function logout(req, res) {
  const rt = req.cookies?.refreshToken
  if (rt) {
    await prisma.refreshToken.updateMany({ where: { token: rt }, data: { revoked: true } })
  }
  res.clearCookie('refreshToken', { path: '/' })
  res.clearCookie('accessToken', { path: '/' })
  res.json({ success: true })
}

export async function me(req, res) {
  const token = req.cookies?.accessToken
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}
