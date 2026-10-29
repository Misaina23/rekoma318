import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'
import { createSession, verifyCredentials } from '@/lib/server/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/server/rateLimit'

export async function POST(req: NextRequest) {
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

    if (r.ok && (data?.user || data?.success)) {
      resetRateLimit(rateLimitKey)
      const user = data.user || { email, role: 'super_admin' }
      const requiresTwoFactor = data?.requiresTwoFactor !== false

      if (requiresTwoFactor) {
        // Request 2FA code
        const twoFa = await fetch(`${API}/api/verification/2fa/request`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }).catch(() => null)
        const twoFaData = twoFa ? await twoFa.json().catch(() => ({})) : null
        const sessionId = twoFaData?.sessionId || `session_${Date.now()}`

        // Temporary 2FA verification ticket (not the final admin session)
        const res = NextResponse.json({
          ok: true,
          requiresTwoFactor: true,
          sessionId,
          message: 'Code 2FA envoyé'
        })
        res.cookies.set('rekoma_2fa_pending', Buffer.from(JSON.stringify({ email, role: user.role, sessionId })).toString('base64'), {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 10 * 60,
        })
        return res
      }

      // No 2FA required: grant session directly
      const sessionToken = createSession(user.email, user.role)
      const res = NextResponse.json({ ok: true, user, accessToken: data.accessToken || sessionToken })
      res.cookies.set('rekoma_admin', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      if (data.accessToken) {
        res.cookies.set('rekoma_access_token', data.accessToken, {
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 8,
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
    const sessionToken = createSession(email, 'super_admin')
    const res = NextResponse.json({
      ok: true,
      user: { email, role: 'super_admin', name: 'Administrateur REKOMA' },
      accessToken: sessionToken,
    })
    res.cookies.set('rekoma_admin', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    res.cookies.set('rekoma_access_token', sessionToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  }

  return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
}
