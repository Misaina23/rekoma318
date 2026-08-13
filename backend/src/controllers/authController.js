import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { welcomeEmail, passwordResetEmail } from '../utils/mail.js'

const prisma = new PrismaClient()

function createAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

function createRefreshTokenValue() {
  return crypto.randomUUID?.() ?? crypto.randomBytes(32).toString('hex')
}

export async function register(req, res) {
  const { email, password, name, role } = req.body
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ success: false, error: 'Email already registered' })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || null, role: role || 'USER' },
  })

  await welcomeEmail(name || email, email)

  res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  })
}

export async function forgotPassword(req, res) {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond success to avoid user enumeration.
  if (user) {
    const resetToken = jwt.sign({ sub: user.id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const resetLink = `${process.env.FRONTEND_URL || 'https://rekoma-318.vercel.app'}/admin/reset-password?token=${resetToken}`
    await passwordResetEmail(email, resetLink)
  }
  res.json({ success: true, message: 'If the account exists, a reset email has been sent.' })
}

export async function login(req, res) {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' })

  const accessToken = createAccessToken(user)
  const refreshTokenValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({ data: { token: refreshTokenValue, userId: user.id, expiresAt } })
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
  // set refresh token (long-lived)
  res.cookie('refreshToken', refreshTokenValue, cookieOpts)
  // set short-lived access token cookie (15m)
  const accessCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
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

  // rotate refresh token
  const newRtValue = createRefreshTokenValue()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true } })
  await prisma.refreshToken.create({ data: { token: newRtValue, userId: tokenRecord.userId, expiresAt } })

  const accessToken = createAccessToken(tokenRecord.user)
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
  res.cookie('refreshToken', newRtValue, cookieOpts)
  const accessCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } })
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}
