import { NextResponse, type NextRequest } from 'next/server'
import { getSession, issue2FASecret } from '@/lib/server/auth'

// Stub: provision and verify a TOTP secret for the signed-in admin.
export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const secret = issue2FASecret()
  if (body.code) {
    // TODO: verify TOTP(secret, code).
    return NextResponse.json({ ok: true, enabled: true })
  }
  return NextResponse.json({ ok: true, secret })
}
