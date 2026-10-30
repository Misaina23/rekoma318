import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'
import { FOUNDATIONAL_BUREAU } from '@/lib/foundational-members'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function buildHeaders(authHeader?: string) {
  return {
    'content-type': 'application/json',
    ...(authHeader ? { authorization: authHeader } : {}),
  }
}

const DEFAULT_USERS = [
  {
    id: 'user-admin-1',
    email: 'admin@rekoma.mg',
    name: 'Administrateur REKOMA',
    role: 'super_admin',
    roleLabel: 'Super Administrateur',
    active: true,
    memberId: null,
    roleId: 'role-super_admin',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
]

async function getLocalMembers() {
  const local = await readJson<any[]>('members.json', [])
  const source = local.length > 0 ? local : FOUNDATIONAL_BUREAU.map((m, idx) => ({ ...m, id: `gov-${idx + 1}` }))
  return source
    .filter((m) => !m.deletedAt && m.status !== 'inactive')
    .map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email || '',
      role: m.role || '',
      designation: m.designation || '',
      phone: m.phone || '',
      photo: m.photo || '',
    }))
}

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  const subtype = req.nextUrl.searchParams.get('type')

  if (subtype === 'members') {
    try {
      const r = await fetch(`${API}/api/users/members`, { headers: buildHeaders(authHeader), cache: 'no-store' })
      if (r.ok) {
        const data = await r.json().catch(() => [])
        if (Array.isArray(data) && data.length > 0) return NextResponse.json(data)
      }
    } catch {}
    const fallbackMembers = await getLocalMembers()
    return NextResponse.json(fallbackMembers)
  }

  try {
    const r = await fetch(`${API}/api/users`, { headers: buildHeaders(authHeader), cache: 'no-store' })
    if (r.ok) {
      const data = await r.json().catch(() => [])
      if (Array.isArray(data) && data.length > 0) {
        // Also check if any local users were created while backend was offline
        const localUsers = await readJson<any[]>('users.json', [])
        const remoteIds = new Set(data.map((u: any) => u.id || u.email))
        const unmerged = localUsers.filter((u: any) => !remoteIds.has(u.id) && !remoteIds.has(u.email))
        return NextResponse.json([...data, ...unmerged])
      }
    }
  } catch {}

  const localUsers = await readJson<any[]>('users.json', DEFAULT_USERS)
  return NextResponse.json(localUsers)
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res
  const body = await req.json().catch(() => null)

  const memberId = body?.memberId
  const customEmail = body?.email ? String(body.email).trim() : ''
  const role = body?.role || 'admin'
  const roleId = body?.roleId || (role === 'finance_lead' ? 'role-finance_lead' : 'role-admin')

  // Find member info if provided
  let member: any = null
  if (memberId) {
    const members = await getLocalMembers()
    member = members.find((m) => m.id === memberId) || null
  }

  const finalEmail = customEmail || (member ? member.email : '')
  if (!finalEmail) {
    return NextResponse.json({ error: 'Une adresse email valide est requise pour créer le compte.' }, { status: 400 })
  }

  const plainPassword = body?.password || `Rekoma#${crypto.randomInt(1000, 9999)}`

  // 1. Try remote backend creation first
  try {
    const r = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: buildHeaders(authHeader),
      body: JSON.stringify({
        memberId: memberId || undefined,
        email: finalEmail,
        password: plainPassword,
        role,
        roleId,
      }),
    })
    const data = await r.json().catch(() => ({}))
    if (r.ok) {
      // Also cache user locally
      const localUsers = await readJson<any[]>('users.json', DEFAULT_USERS)
      const newUser = data.user || data
      await writeJson('users.json', [newUser, ...localUsers.filter((u: any) => u.id !== newUser.id)])
      return NextResponse.json({
        success: true,
        user: newUser,
        temporaryPassword: data.temporaryPassword || plainPassword,
      }, { status: 201 })
    }
  } catch (err: any) {
    console.warn('Remote user creation failed, saving locally:', err.message)
  }

  // 2. Local fallback user creation
  const localUsers = await readJson<any[]>('users.json', DEFAULT_USERS)
  const existing = localUsers.find((u: any) => u.email.toLowerCase() === finalEmail.toLowerCase())
  if (existing) {
    return NextResponse.json({ error: 'Un compte utilisateur existe déjà pour cet email.' }, { status: 409 })
  }

  const roleLabelMap: Record<string, string> = {
    super_admin: 'Super Administrateur',
    admin: 'Administrateur',
    finance_lead: 'Responsable Finance & Dons',
    manager: 'Coordinateur de projets',
    editor: 'Éditeur & Communication',
    viewer: 'Observateur',
  }

  const memberName = member ? `${member.firstName} ${member.lastName}` : (body?.name || finalEmail.split('@')[0])
  const newUser = {
    id: `user-${Date.now()}`,
    email: finalEmail,
    name: memberName,
    role,
    roleLabel: roleLabelMap[role] || role,
    roleId,
    active: true,
    memberId: memberId || null,
    memberDesignation: member?.designation || member?.role || null,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  }

  await writeJson('users.json', [newUser, ...localUsers])

  return NextResponse.json({
    success: true,
    user: newUser,
    temporaryPassword: plainPassword,
    message: 'Compte utilisateur créé avec succès.',
  }, { status: 201 })
}
