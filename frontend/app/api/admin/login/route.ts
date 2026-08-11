import { NextResponse, type NextRequest } from 'next/server'
import { createSession, verifyCredentials, getDefaultRole } from '@/lib/server/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !verifyCredentials(body.email, body.password)) {
    return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true, role: getDefaultRole() })
  res.cookies.set('rekoma_admin', createSession(process.env.ADMIN_EMAIL || 'admin@rekoma.mg', getDefaultRole()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}
