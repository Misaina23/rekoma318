import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { hasPermission as checkPermission, resolvePermissions } from '../lib/permissions.js'

const JWT_SECRET = process.env.JWT_SECRET?.trim()
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables')
}

let emailVerifiedEnabled = true
try {
  await prisma.$queryRaw`SELECT "emailVerified" FROM "User" LIMIT 0`
} catch {
  emailVerifiedEnabled = false
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  let token
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7)
  else token = req.cookies?.accessToken

  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })
  if (!JWT_SECRET) return res.status(500).json({ success: false, error: 'Server misconfigured: JWT_SECRET missing' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    if (user.active === false) return res.status(403).json({ success: false, error: 'Account disabled' })
    if (emailVerifiedEnabled && !user.emailVerified) return res.status(403).json({ success: false, error: 'Email non vérifié' })
    req.user = user
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export async function requirePermission(capability) {
  return async (req, res, next) => {
    const auth = req.headers.authorization
    let token
    if (auth && auth.startsWith('Bearer ')) token = auth.slice(7)
    else token = req.cookies?.accessToken

    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })
    if (!JWT_SECRET) return res.status(500).json({ success: false, error: 'Server misconfigured: JWT_SECRET missing' })

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub || payload.userId } })
      if (!user) return res.status(404).json({ success: false, error: 'User not found' })
      if (user.active === false) return res.status(403).json({ success: false, error: 'Account disabled' })
      if (emailVerifiedEnabled && !user.emailVerified) return res.status(403).json({ success: false, error: 'Email non vérifié' })

      req.user = user
      const allowed = await checkPermission(user, capability)
      if (!allowed) {
        return res.status(403).json({ success: false, error: `Forbidden: missing permission ${capability}` })
      }
      return next()
    } catch (err) {
      console.error('requirePermission error:', err)
      return res.status(500).json({ success: false, error: 'Server error' })
    }
  }
}

export function requireRole(role) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    const allowed = req.user.role === role || req.user.role === 'super_admin'
    if (!allowed) return res.status(403).json({ success: false, error: 'Forbidden' })
    next()
  }
}