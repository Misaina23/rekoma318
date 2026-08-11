import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/server/auth'
import { ROLE_LABELS } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  return NextResponse.json({ email: session.email, role: session.role, roleLabel: ROLE_LABELS[session.role] })
}
