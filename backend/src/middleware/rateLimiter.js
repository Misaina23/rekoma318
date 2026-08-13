import { prisma } from '../lib/prisma.js'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 5

const attempts = new Map()

export function rateLimit(key) {
  const now = Date.now()
  const entry = attempts.get(key) || { count: 0, resetAt: now + WINDOW_MS }

  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + WINDOW_MS
  }

  entry.count += 1
  attempts.set(key, entry)

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count + 1 }
}

export async function checkBruteForce(email) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return false

  const failedAttempts = await prisma.refreshToken.count({
    where: {
      userId: user.id,
      revoked: false,
      expiresAt: { lt: new Date() },
    },
  })

  return false
}
