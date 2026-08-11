import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { defaultRole, type Role } from '@/lib/roles'

const SECRET = process.env.ADMIN_SESSION_SECRET || 'rekoma-session-secret-change-me'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@rekoma.mg'
const PASSWORD = process.env.ADMIN_PASSWORD || 'rekoma2026'

export type Session = { email: string; role: Role }

function sign(payload: string) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function createSession(email: string, role: Role): string {
  const payload = `${email}|${role}`
  return Buffer.from(`${payload}|${sign(payload)}`).toString('base64')
}

export function decodeSession(cookie?: string): Session | null {
  if (!cookie) return null
  try {
    const raw = Buffer.from(cookie, 'base64').toString('utf-8')
    const [email, role, sig] = raw.split('|')
    if (!email || !role || !sig) return null
    const expected = sign(`${email}|${role}`)
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    return { email, role: role as Role }
  } catch {
    return null
  }
}

export function verifyCredentials(email: string, password: string) {
  return email === EMAIL && password === PASSWORD
}

export function getSession(req: NextRequest): Session | null {
  return decodeSession(req.cookies.get('rekoma_admin')?.value)
}

// Stub: in production this would send a real email / generate a TOTP secret.
export function issue2FASecret() {
  return crypto.randomBytes(16).toString('hex')
}

export function getDefaultRole(): Role {
  return defaultRole()
}
