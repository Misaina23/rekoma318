import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

const DEFAULT_ROLES = [
  { id: 'role-super_admin', name: 'super_admin', label: 'Super Administrateur', description: 'Accès complet au système et à tous les modules', isSystem: true, permissionKeys: ['manage_roles', 'manage_settings', 'manage_members', 'manage_personnel', 'manage_beneficiaries', 'manage_formations', 'manage_activities', 'manage_donations', 'manage_messages', 'manage_products', 'manage_orders', 'manage_cms', 'view_analytics'] },
  { id: 'role-admin', name: 'admin', label: 'Administrateur', description: 'Gestion administrative complète hors configuration des rôles système', isSystem: true, permissionKeys: ['manage_members', 'manage_personnel', 'manage_beneficiaries', 'manage_formations', 'manage_activities', 'manage_donations', 'manage_messages', 'manage_products', 'manage_orders', 'manage_cms', 'view_analytics'] },
  { id: 'role-finance_lead', name: 'finance_lead', label: 'Responsable Finance & Dons', description: 'Gestion des finances, validation des dons et suivi des commandes boutique', isSystem: true, permissionKeys: ['manage_donations', 'manage_orders', 'view_analytics'] },
  { id: 'role-manager', name: 'manager', label: 'Coordinateur de projets', description: 'Coordination opérationnelle des projets, bénéficiaires et formations', isSystem: true, permissionKeys: ['manage_members', 'manage_beneficiaries', 'manage_formations', 'manage_activities', 'manage_products', 'manage_orders'] },
  { id: 'role-editor', name: 'editor', label: 'Éditeur & Communication', description: 'Gestion éditoriale, actualités, galerie, documents et messagerie', isSystem: true, permissionKeys: ['manage_cms', 'manage_activities', 'manage_messages'] },
  { id: 'role-viewer', name: 'viewer', label: 'Observateur', description: 'Consultation seule sans pouvoir modifier les données', isSystem: true, permissionKeys: ['view_dashboard'] },
]

const DEFAULT_PERMISSIONS = [
  { id: 'perm-roles', key: 'manage_roles', label: 'Gérer les rôles et permissions', category: 'Système' },
  { id: 'perm-settings', key: 'manage_settings', label: 'Paramètres système & sécurité', category: 'Système' },
  { id: 'perm-members', key: 'manage_members', label: 'Gérer les membres et la gouvernance', category: 'Gouvernance' },
  { id: 'perm-personnel', key: 'manage_personnel', label: 'Gérer le personnel et contrats', category: 'Gouvernance' },
  { id: 'perm-beneficiaries', key: 'manage_beneficiaries', label: 'Gérer les bénéficiaires', category: 'Projets' },
  { id: 'perm-formations', key: 'manage_formations', label: 'Gérer les formations et attestations', category: 'Projets' },
  { id: 'perm-activities', key: 'manage_activities', label: 'Gérer les activités PDIMA', category: 'Projets' },
  { id: 'perm-cms', key: 'manage_cms', label: 'Actualités, documents et galerie', category: 'Communication' },
  { id: 'perm-messages', key: 'manage_messages', label: 'Messagerie et réponses aux contacts', category: 'Communication' },
  { id: 'perm-donations', key: 'manage_donations', label: 'Gérer les dons et paiements (Stripe / MVola)', category: 'Finances' },
  { id: 'perm-orders', key: 'manage_orders', label: 'Gérer les commandes de la boutique', category: 'Boutique' },
  { id: 'perm-products', key: 'manage_products', label: 'Gérer le catalogue d’articles', category: 'Boutique' },
  { id: 'perm-analytics', key: 'view_analytics', label: 'Consulter les statistiques détaillées', category: 'Système' },
]

async function getLocalRoles() {
  const custom = await readJson<any[]>('custom_roles.json', [])
  const map = new Map<string, any>()
  for (const r of DEFAULT_ROLES) map.set(r.id, r)
  for (const r of custom) map.set(r.id, r)
  return Array.from(map.values())
}

async function saveLocalRole(roleData: any, isUpdate = false) {
  const custom = await readJson<any[]>('custom_roles.json', [])
  const id = roleData.id || `role-${roleData.name || Date.now()}`
  const newRole = {
    id,
    name: roleData.name,
    label: roleData.label || roleData.name,
    description: roleData.description || '',
    isSystem: false,
    permissionKeys: Array.isArray(roleData.permissionKeys) ? roleData.permissionKeys : [],
    createdAt: new Date().toISOString(),
  }
  let updatedList: any[]
  if (isUpdate) {
    updatedList = custom.map((r) => (r.id === id ? { ...r, ...newRole } : r))
  } else {
    updatedList = [...custom.filter((r) => r.id !== id), newRole]
  }
  await writeJson('custom_roles.json', updatedList)
  return newRole
}

async function deleteLocalRole(id: string) {
  const custom = await readJson<any[]>('custom_roles.json', [])
  await writeJson('custom_roles.json', custom.filter((r) => r.id !== id))
}

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
      if (method === 'GET' && subpath === 'roles') return NextResponse.json(await getLocalRoles())
      if (method === 'GET' && subpath === 'permissions') return NextResponse.json(DEFAULT_PERMISSIONS)
      
      // Fallback local persistence if remote RBAC endpoint is unavailable
      if (method === 'POST' && subpath === 'roles' && rawBody) {
        const bodyParsed = JSON.parse(rawBody)
        const saved = await saveLocalRole(bodyParsed, false)
        return NextResponse.json(saved, { status: 201 })
      }
      if (method === 'PUT' && subpath.startsWith('roles/') && rawBody) {
        const roleId = subpath.replace(/^roles\//, '')
        const bodyParsed = JSON.parse(rawBody)
        const saved = await saveLocalRole({ ...bodyParsed, id: roleId }, true)
        return NextResponse.json(saved, { status: 200 })
      }
      if (method === 'DELETE' && subpath.startsWith('roles/')) {
        const roleId = subpath.replace(/^roles\//, '')
        await deleteLocalRole(roleId)
        return NextResponse.json({ ok: true })
      }

      return NextResponse.json(
        { error: data?.error || data?.message || 'Erreur lors de l’opération RBAC', message: data?.error || data?.message || 'Erreur' },
        { status: r.status }
      )
    }
    return NextResponse.json(data ?? { ok: true }, { status: r.status })
  } catch (e: any) {
    if (method === 'GET' && subpath === 'roles') return NextResponse.json(await getLocalRoles())
    if (method === 'GET' && subpath === 'permissions') return NextResponse.json(DEFAULT_PERMISSIONS)
    if (method === 'POST' && subpath === 'roles' && rawBody) {
      try {
        const bodyParsed = JSON.parse(rawBody)
        const saved = await saveLocalRole(bodyParsed, false)
        return NextResponse.json(saved, { status: 201 })
      } catch {}
    }
    if (method === 'PUT' && subpath.startsWith('roles/') && rawBody) {
      try {
        const roleId = subpath.replace(/^roles\//, '')
        const bodyParsed = JSON.parse(rawBody)
        const saved = await saveLocalRole({ ...bodyParsed, id: roleId }, true)
        return NextResponse.json(saved, { status: 200 })
      } catch {}
    }
    if (method === 'DELETE' && subpath.startsWith('roles/')) {
      const roleId = subpath.replace(/^roles\//, '')
      await deleteLocalRole(roleId)
      return NextResponse.json({ ok: true })
    }
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
