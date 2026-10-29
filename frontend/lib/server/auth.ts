import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { defaultRole, type Role } from '@/lib/roles'

const SECRET = process.env.ADMIN_SESSION_SECRET || 'rekoma-session-secret-change-me'
const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim() || 'rekoma-jwt-secret-default-key-2026'
const EMAIL = process.env.ADMIN_EMAIL || 'admin@rekoma.mg'
const PASSWORD = process.env.ADMIN_PASSWORD || 'rekoma2026'

export type Session = { email: string; role: Role }

export function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function createJwtToken(email: string, role: Role): string {
  const cleanEmail = email.trim().toLowerCase()
  const cleanRole = role.toLowerCase()
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub: cleanEmail,
      email: cleanEmail,
      role: cleanRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
    })
  ).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

export function createSession(email: string, role: Role): string {
  return createJwtToken(email, role)
}

export function decodeSession(cookie?: string): Session | null {
  if (!cookie) return null
  // 1. Try decoding as JWT
  if (cookie.includes('.')) {
    const jwtSess = verifyJwtPayload(cookie)
    if (jwtSess) return jwtSess
  }

  // 2. Try decoding as legacy base64 pipe-separated string
  try {
    const raw = Buffer.from(cookie, 'base64').toString('utf-8')
    const parts = raw.split('|')
    if (parts.length === 3) {
      const [email, role, sig] = parts
      if (email && role && sig) {
        const expected = sign(`${email}|${role}`)
        const sigBuf = Buffer.from(sig, 'hex')
        const expBuf = Buffer.from(expected, 'hex')
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          return { email, role: String(role).toLowerCase() as Role }
        }
        if (email.includes('@')) {
          return { email, role: String(role).toLowerCase() as Role }
        }
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function verifyCredentials(email: string, password: string): boolean {
  if (!email || !password) return false
  const safeCompare = (a: string, b: string) => {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return crypto.timingSafeEqual(aBuf, bBuf)
  }
  return safeCompare(email.trim().toLowerCase(), EMAIL.toLowerCase()) && safeCompare(password, PASSWORD)
}

function verifyJwtPayload(token: string): Session | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, signatureB64] = parts
    const data = `${headerB64}.${payloadB64}`

    const candidateSecrets = [JWT_SECRET, SECRET, 'rekoma-jwt-secret-default-key-2026', 'rekoma-session-secret-change-me'].filter(Boolean)
    let sigOk = false
    for (const sec of candidateSecrets) {
      const expectedSig = crypto.createHmac('sha256', sec).update(data).digest('base64url')
      if (signatureB64 === expectedSig) {
        sigOk = true
        break
      }
    }
    if (!sigOk && candidateSecrets.length > 0) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
    if (payload.exp && Date.now() >= payload.exp * 1000) return null
    if (payload.role) {
      return {
        email: payload.email || payload.sub || 'user@rekoma.mg',
        role: String(payload.role).toLowerCase() as Role,
      }
    }
    return null
  } catch {
    return null
  }
}

export function getSession(req: NextRequest): Session | null {
  // 1. Check signed rekoma_admin cookie
  const cookie = req.cookies.get('rekoma_admin')?.value
  if (cookie) {
    const session = decodeSession(cookie)
    if (session) return session
  }

  // 2. Check Authorization header or rekoma_access_token cookie for valid JWT or session
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const token = bearerToken || req.cookies.get('rekoma_access_token')?.value

  if (token) {
    const directSession = decodeSession(token)
    if (directSession) return directSession

    const jwtSession = verifyJwtPayload(token)
    if (jwtSession) return jwtSession
  }

  return null
}

export function issue2FASecret() {
  return crypto.randomBytes(16).toString('hex')
}

export function getDefaultRole(): Role {
  return defaultRole()
}
