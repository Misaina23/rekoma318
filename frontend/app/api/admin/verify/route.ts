import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'

// Stub: verify the 6-digit code sent by email / 2FA app.
export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.code || String(body.code).length < 4) {
    return NextResponse.json({ message: 'Code invalide' }, { status: 400 })
  }
  // TODO: validate TOTP / email code.
  return NextResponse.json({ ok: true, verified: true })
}
