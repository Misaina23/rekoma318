import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from './auth'
import { can, type Capability } from '@/lib/roles'

export function requireAuth(req: NextRequest, capability?: Capability) {
  const session = getSession(req)
  if (!session) {
    return { res: NextResponse.json({ message: 'Non autorisé' }, { status: 401 }), session: null }
  }
  if (capability && !can(session.role, capability)) {
    return { res: NextResponse.json({ message: 'Permission refusée' }, { status: 403 }), session }
  }
  return { res: null, session }
}
