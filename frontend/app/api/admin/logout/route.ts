import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const isSecure = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:'
  const sameSite: 'none' | 'lax' = isSecure ? 'none' : 'lax'
  const res = NextResponse.json({ ok: true })
  res.cookies.set('rekoma_admin', '', { httpOnly: true, path: '/', maxAge: 0, sameSite, secure: isSecure })
  res.cookies.set('rekoma_access_token', '', { httpOnly: false, path: '/', maxAge: 0, sameSite, secure: isSecure })
  res.cookies.set('rekoma_refresh_token', '', { httpOnly: true, path: '/', maxAge: 0, sameSite, secure: isSecure })
  res.cookies.set('rekoma_2fa_pending', '', { httpOnly: true, path: '/', maxAge: 0, sameSite, secure: isSecure })
  return res
}
