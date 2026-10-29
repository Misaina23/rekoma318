import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

const DEFAULT_ROLES = [
  { id: 'role-super_admin', name: 'super_admin', label: 'Super Administrateur', description: 'Accès complet au système', isSystem: true, permissionKeys: ['manage_roles', 'manage_members', 'manage_formations', 'manage_activities', 'manage_donations', 'manage_messages', 'manage_products', 'manage_orders', 'manage_cms'] },
  { id: 'role-admin', name: 'admin', label: 'Administrateur', description: 'Gestion administrative complète', isSystem: true, permissionKeys: ['manage_members', 'manage_formations', 'manage_activities', 'manage_donations', 'manage_messages', 'manage_products', 'manage_orders', 'manage_cms'] },
  { id: 'role-manager', name: 'manager', label: 'Coordinateur', description: 'Coordination des projets et formations', isSystem: true, permissionKeys: ['manage_members', 'manage_formations', 'manage_activities', 'manage_products', 'manage_orders'] },
  { id: 'role-editor', name: 'editor', label: 'Éditeur', description: 'Gestion éditoriale et catalogue', isSystem: true, permissionKeys: ['manage_cms', 'manage_activities', 'manage_products'] },
  { id: 'role-finance_lead', name: 'finance_lead', label: 'Responsable Financier', description: 'Suivi des dons et commandes', isSystem: true, permissionKeys: ['manage_donations', 'manage_orders'] },
]

const DEFAULT_PERMISSIONS = [
  { id: 'perm-roles', key: 'manage_roles', label: 'Gérer les rôles et utilisateurs', category: 'system' },
  { id: 'perm-members', key: 'manage_members', label: 'Gérer les membres et la gouvernance', category: 'members' },
  { id: 'perm-formations', key: 'manage_formations', label: 'Gérer les formations et attestations', category: 'cms' },
  { id: 'perm-activities', key: 'manage_activities', label: 'Gérer les activités', category: 'cms' },
  { id: 'perm-cms', key: 'manage_cms', label: 'Gérer les actualités, documents et galerie', category: 'cms' },
  { id: 'perm-donations', key: 'manage_donations', label: 'Gérer les dons', category: 'finance' },
  { id: 'perm-messages', key: 'manage_messages', label: 'Gérer la messagerie', category: 'communication' },
  { id: 'perm-products', key: 'manage_products', label: 'Gérer les articles de la boutique', category: 'store' },
  { id: 'perm-orders', key: 'manage_orders', label: 'Gérer les commandes de la boutique', category: 'store' },
]

async function proxyRoles(req: NextRequest, pathSegments: string[]) {
  const { res, authHeader } = requireAuth(req, 'manage_roles')
  if (res) return res

  const subpath = pathSegments.join('/')
  const qs = req.nextUrl.searchParams.toString()
  const url = `${API}/api/roles/${subpath}${qs ? `?${qs}` : ''}`
  const method = req.method
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE'
  const rawBody = hasBody ? await req.text().catch(() => '') : undefined

  try {
    const r = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      ...(hasBody && rawBody ? { body: rawBody } : {}),
      cache: 'no-store',
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) {
      if (method === 'GET' && subpath === 'roles') return NextResponse.json(DEFAULT_ROLES)
      if (method === 'GET' && subpath === 'permissions') return NextResponse.json(DEFAULT_PERMISSIONS)
      return NextResponse.json(
        { error: data?.error || data?.message || 'Erreur lors de l’opération RBAC', message: data?.error || data?.message || 'Erreur' },
        { status: r.status }
      )
    }
    return NextResponse.json(data ?? { ok: true }, { status: r.status })
  } catch (e: any) {
    if (method === 'GET' && subpath === 'roles') return NextResponse.json(DEFAULT_ROLES)
    if (method === 'GET' && subpath === 'permissions') return NextResponse.json(DEFAULT_PERMISSIONS)
    return NextResponse.json({ error: e.message || 'Serveur inaccessible', message: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRoles(req, params.path || [])
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRoles(req, params.path || [])
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRoles(req, params.path || [])
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRoles(req, params.path || [])
}
