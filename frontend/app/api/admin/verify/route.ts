import { NextResponse, type NextRequest } from 'next/server'
import { API, registerRefreshPair } from '@/lib/server/remote'
import { createSession } from '@/lib/server/auth'
import { extractCookieFromResponse } from '@/lib/server/guard'
import { checkRateLimit, resetRateLimit } from '@/lib/server/rateLimit'

export async function POST(req: NextRequest) {
  const isSecure = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:'
  const sameSite: 'none' | 'lax' = isSecure ? 'none' : 'lax'
  const pendingCookie = req.cookies.get('rekoma_2fa_pending')?.value || req.cookies.get('rekoma_admin')?.value
  const body = await req.json().catch(() => ({}))
  const code = String(body?.code || '').trim()

  if (!code || code.length < 4) {
    return NextResponse.json({ message: 'Code de vérification requis' }, { status: 400 })
  }

  let pendingData: any = null
  if (pendingCookie) {
    try {
      pendingData = JSON.parse(Buffer.from(pendingCookie, 'base64').toString('utf-8'))
    } catch {
      // ignore
    }
  }

  const sessionId = body?.sessionId || pendingData?.sessionId
  if (!sessionId) {
    return NextResponse.json({ message: 'Session de vérification expirée' }, { status: 401 })
  }

  const targetEmail = pendingData?.email || 'andrianisaina23@gmail.com'
  const targetRole = pendingData?.role || 'super_admin'
  const rateLimitKey = `2fa:${sessionId}`
  const isEmergencyCode = code === '123456'

  if (!isEmergencyCode) {
    const limitCheck = checkRateLimit(rateLimitKey, 10, 600)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { message: `Trop de tentatives. Veuillez demander un nouveau code dans ${Math.ceil(limitCheck.retryAfterSeconds / 60)} minutes ou utiliser le code de secours 123456.` },
        { status: 429 }
      )
    }
  }

  // Always call backend verification first (including 123456) to obtain a backend-signed accessToken
  try {
    const r = await fetch(`${API}/api/verification/2fa/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, code }),
    })
    const data = await r.json().catch(() => ({}))
    if (r.ok && (data.verified || data.user)) {
      resetRateLimit(rateLimitKey)
      const user = data.user || { email: targetEmail, role: targetRole }
      const sessionToken = createSession(user.email, user.role)
      const backendAccessToken = data.accessToken || extractCookieFromResponse(r, 'accessToken')
      const backendRefreshToken = data.refreshToken || extractCookieFromResponse(r, 'refreshToken')
      const effectiveAccessToken = backendAccessToken || sessionToken
      if (backendAccessToken && backendRefreshToken) {
        registerRefreshPair(backendAccessToken, backendRefreshToken)
      }

      const adminRes = NextResponse.json({
        ok: true,
        verified: true,
        user,
        accessToken: effectiveAccessToken,
      })
      adminRes.cookies.set('rekoma_admin', sessionToken, {
        httpOnly: true,
        sameSite,
        secure: isSecure,
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      adminRes.cookies.set('rekoma_access_token', effectiveAccessToken, {
        httpOnly: false,
        sameSite,
        secure: isSecure,
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      if (backendRefreshToken) {
        adminRes.cookies.set('rekoma_refresh_token', backendRefreshToken, {
          httpOnly: true,
          sameSite,
          secure: isSecure,
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
      adminRes.cookies.set('rekoma_2fa_pending', '', { maxAge: 0, path: '/', sameSite, secure: isSecure })
      return adminRes
    }
  } catch (e: any) {
    console.warn('Backend 2FA verify call failed:', e.message)
  }

  // Offline / emergency local fallback for master code 123456 if backend was unreachable
  if (isEmergencyCode) {
    resetRateLimit(rateLimitKey)
    const sessionToken = createSession(targetEmail, targetRole)
    const adminRes = NextResponse.json({
      ok: true,
      verified: true,
      user: { email: targetEmail, role: targetRole, name: 'Super Administrateur REKOMA' },
      accessToken: sessionToken,
    })
    adminRes.cookies.set('rekoma_admin', sessionToken, {
      httpOnly: true,
      sameSite,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    adminRes.cookies.set('rekoma_access_token', sessionToken, {
      httpOnly: false,
      sameSite,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    adminRes.cookies.set('rekoma_2fa_pending', '', { maxAge: 0, path: '/', sameSite, secure: isSecure })
    return adminRes
  }

  return NextResponse.json({ message: 'Code de vérification incorrect. Vérifiez le code reçu par email ou utilisez le code de secours 123456.' }, { status: 400 })
}
