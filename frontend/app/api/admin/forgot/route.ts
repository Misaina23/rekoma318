import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'

// Stub: in production, generate a reset token and send a real email via SMTP.
export async function POST(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  // TODO: wire transactional email (SMTP) to send the reset link to body.email.
  return NextResponse.json({ ok: true, message: 'Email de réinitialisation envoyé (démo).' })
}
