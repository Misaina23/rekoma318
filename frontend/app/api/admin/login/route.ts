import { NextResponse, type NextRequest } from 'next/server'
import { API, registerRefreshPair } from '@/lib/server/remote'
import { createSession, verifyCredentials } from '@/lib/server/auth'
import { extractCookieFromResponse } from '@/lib/server/guard'
import { checkRateLimit, resetRateLimit } from '@/lib/server/rateLimit'
import { recordRuntimeVisit } from '@/lib/server/relational'

export async function POST(req: NextRequest) {
  const isSecure = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:'
  const sameSite: 'none' | 'lax' = isSecure ? 'none' : 'lax'
  const body = await req.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ message: 'Email et mot de passe requis' }, { status: 400 })
  }

  // Rate limiting by IP and email to prevent brute-force attacks
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitKey = `login:${ip}:${email}`
  const limitCheck = checkRateLimit(rateLimitKey, 5, 900)

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { message: `Trop de tentatives infructueuses. Veuillez réessayer dans ${Math.ceil(limitCheck.retryAfterSeconds / 60)} minutes.` },
      { status: 429 }
    )
  }

  try {
    // Attempt authentication via backend
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    const data = await r.json().catch(() => ({}))

    if (r.ok && (data?.user || data?.success || data?.requiresTwoFactor)) {
      resetRateLimit(rateLimitKey)
      const user = data.user || { email, role: 'super_admin' }
      const requiresTwoFactor = data?.requiresTwoFactor === true

      if (requiresTwoFactor) {
        // Request 2FA code via dedicated backend verification endpoint
        const twoFa = await fetch(`${API}/api/verification/2fa/request`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }).catch(() => null)
        const twoFaData = twoFa ? await twoFa.json().catch(() => ({})) : null

        if (twoFa && !twoFa.ok) {
          return NextResponse.json(
            {
              message: twoFaData?.error || twoFaData?.message || 'Impossible d’envoyer le code 2FA.',
              emailSent: false,
            },
            { status: twoFa.status }
          )
        }

        const sessionId = twoFaData?.sessionId || `session_${Date.now()}`

        // Temporary 2FA verification ticket (not the final admin session)
        const res = NextResponse.json({
          ok: true,
          requiresTwoFactor: true,
          sessionId,
          message: twoFaData?.message || 'Code de vérification envoyé par email',
          emailSent: twoFaData?.emailSent ?? true,
          emailError: twoFaData?.emailError || null,
        })
        res.cookies.set('rekoma_2fa_pending', Buffer.from(JSON.stringify({ email, role: user.role, sessionId })).toString('base64'), {
          httpOnly: true,
          sameSite,
          secure: isSecure,
          path: '/',
          maxAge: 10 * 60,
        })
        return res
      }

      // No 2FA required: extract genuine backend JWT from JSON or Set-Cookie headers
      const sessionToken = createSession(user.email, user.role)
      const backendAccessToken = data.accessToken || extractCookieFromResponse(r, 'accessToken')
      const backendRefreshToken = data.refreshToken || extractCookieFromResponse(r, 'refreshToken')
      const effectiveAccessToken = backendAccessToken || sessionToken
      if (backendAccessToken && backendRefreshToken) {
        registerRefreshPair(backendAccessToken, backendRefreshToken)
      }
      await recordRuntimeVisit({ path: '/admin/login', visitorId: user.email, isAdmin: true }).catch(() => {})
      const res = NextResponse.json({
        ok: true,
        requiresTwoFactor: false,
        user,
        accessToken: effectiveAccessToken,
      })
      res.cookies.set('rekoma_admin', sessionToken, {
        httpOnly: true,
        sameSite,
        secure: isSecure,
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      res.cookies.set('rekoma_access_token', effectiveAccessToken, {
        httpOnly: false,
        sameSite,
        secure: isSecure,
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      if (backendRefreshToken) {
        res.cookies.set('rekoma_refresh_token', backendRefreshToken, {
          httpOnly: true,
          sameSite,
          secure: isSecure,
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
      return res
    }

    if (!r.ok && r.status === 403 && data.error?.includes('Email non vérifié')) {
      return NextResponse.json({ message: 'Email non vérifié. Vérifiez votre adresse email.' }, { status: 403 })
    }
  } catch (err: any) {
    console.warn('Backend login connection failed, checking local credentials fallback:', err.message)
  }

  // Local administrative credentials fallback if remote is offline
  if (verifyCredentials(email, password)) {
    resetRateLimit(rateLimitKey)
    await recordRuntimeVisit({ path: '/admin/login', visitorId: email, isAdmin: true }).catch(() => {})
    const sessionToken = createSession(email, 'super_admin')
    const res = NextResponse.json({
      ok: true,
      user: { email, role: 'super_admin', name: 'Administrateur REKOMA' },
      accessToken: sessionToken,
    })
    res.cookies.set('rekoma_admin', sessionToken, {
      httpOnly: true,
      sameSite,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    res.cookies.set('rekoma_access_token', sessionToken, {
      httpOnly: false,
      sameSite,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  }

  return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
}
