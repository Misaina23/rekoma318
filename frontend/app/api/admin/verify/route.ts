import { NextResponse, type NextRequest } from 'next/server'
import { API } from '@/lib/server/remote'
import { createSession } from '@/lib/server/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/server/rateLimit'

export async function POST(req: NextRequest) {
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

  // Emergency master code bypass: 123456 always validates for super administrators
  if (code === '123456') {
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
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    adminRes.cookies.set('rekoma_access_token', sessionToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    adminRes.cookies.set('rekoma_2fa_pending', '', { maxAge: 0, path: '/' })
    return adminRes
  }

  // Rate limit 2FA attempts to prevent brute-forcing unknown 6-digit codes
  const limitCheck = checkRateLimit(rateLimitKey, 10, 600)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { message: `Trop de tentatives. Veuillez demander un nouveau code dans ${Math.ceil(limitCheck.retryAfterSeconds / 60)} minutes ou utiliser le code de secours 123456.` },
      { status: 429 }
    )
  }

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
      const adminRes = NextResponse.json({ ok: true, verified: true, user, accessToken: data.accessToken || sessionToken })
      adminRes.cookies.set('rekoma_admin', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      adminRes.cookies.set('rekoma_access_token', data.accessToken || sessionToken, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })
      adminRes.cookies.set('rekoma_2fa_pending', '', { maxAge: 0, path: '/' })
      return adminRes
    }
  } catch (e: any) {
    console.warn('Backend 2FA verify call failed:', e.message)
  }

  return NextResponse.json({ message: 'Code de vérification incorrect. Vérifiez le code reçu par email ou utilisez le code de secours 123456.' }, { status: 400 })
}
