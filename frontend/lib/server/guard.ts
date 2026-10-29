import { NextResponse, type NextRequest } from 'next/server'
import { createJwtToken, getSession, type Session } from './auth'
import { registerRefreshPair } from './remote'
import { can, type Capability } from '@/lib/roles'

export function sanitizeToken(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null
  let token = raw.trim()
  while (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, '').trim()
  }
  token = token.replace(/^["']+|["']+$/g, '').trim()
  if (!token || token === 'undefined' || token === 'null' || token === '[object Object]') {
    return null
  }
  return token
}

export function extractCookieFromResponse(res: Response, cookieName: string): string | null {
  try {
    const headersAny = res.headers as any
    const setCookies: string[] =
      typeof headersAny.getSetCookie === 'function'
        ? headersAny.getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie') as string]
          : []

    for (const rawCookie of setCookies) {
      const regex = new RegExp(`(?:^|,\\s*)${cookieName}=([^;\\s,]+)`)
      const match = rawCookie.match(regex)
      if (match?.[1]) {
        const cleaned = sanitizeToken(decodeURIComponent(match[1]))
        if (cleaned) return cleaned
      }
    }
  } catch {
    // ignore header parsing issues
  }
  return null
}

export function getBackendAuthHeader(req: NextRequest, session?: Session | null): string | undefined {
  const refreshCookie = sanitizeToken(req.cookies.get('rekoma_refresh_token')?.value)

  const fromHeader = sanitizeToken(req.headers.get('authorization'))
  if (fromHeader && fromHeader.includes('.')) {
    if (refreshCookie) registerRefreshPair(fromHeader, refreshCookie)
    return `Bearer ${fromHeader}`
  }

  const fromAccessCookie = sanitizeToken(req.cookies.get('rekoma_access_token')?.value)
  if (fromAccessCookie && fromAccessCookie.includes('.')) {
    if (refreshCookie) registerRefreshPair(fromAccessCookie, refreshCookie)
    return `Bearer ${fromAccessCookie}`
  }

  const fromAdminCookie = sanitizeToken(req.cookies.get('rekoma_admin')?.value)
  if (fromAdminCookie && fromAdminCookie.includes('.')) {
    if (refreshCookie) registerRefreshPair(fromAdminCookie, refreshCookie)
    return `Bearer ${fromAdminCookie}`
  }

  const resolved = session ?? getSession(req)
  if (resolved) {
    return `Bearer ${createJwtToken(resolved.email, resolved.role)}`
  }
  return undefined
}

export function requireAuth(req: NextRequest, capability?: Capability) {
  const session = getSession(req)
  if (!session) {
    return {
      res: NextResponse.json({ message: 'Non autorisé' }, { status: 401 }),
      session: null,
      authHeader: undefined,
    }
  }
  if (capability && !can(session.role, capability)) {
    return {
      res: NextResponse.json({ message: 'Permission refusée' }, { status: 403 }),
      session,
      authHeader: undefined,
    }
  }
  return {
    res: null,
    session,
    authHeader: getBackendAuthHeader(req, session),
  }
}
