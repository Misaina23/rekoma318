// In-memory sliding-window rate limiter for sensitive endpoints (auth, 2FA, contact)
type AttemptRecord = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, AttemptRecord>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900 // 15 minutes
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  const key = identifier.toLowerCase().trim()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 }
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
  }

  record.count += 1
  return { allowed: true, remaining: maxAttempts - record.count, retryAfterSeconds: 0 }
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier.toLowerCase().trim())
}
