// RBAC: maps dashboard roles to granular capabilities and resolves effective
// permissions for a user (role defaults + optional per-user overrides).

import { prisma } from '../lib/prisma.js'

export const ROLE_LABELS = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  editor: 'Éditeur',
  formation_lead: 'Responsable Formation',
  finance_lead: 'Responsable Finance',
  communication_lead: 'Responsable Communication',
  viewer: 'Observateur',
}

export const ALL_CAPABILITIES = [
  'view_dashboard',
  'members.view',
  'members.create',
  'members.edit',
  'members.delete',
  'manage_members',
  'manage_activities',
  'manage_formations',
  'manage_donations',
  'manage_products',
  'manage_orders',
  'manage_news',
  'manage_gallery',
  'manage_documents',
  'manage_messages',
  'messages.reply',
  'manage_beneficiaries',
  'manage_personnel',
  'view_analytics',
  'manage_settings',
  'manage_roles',
]

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: [...ALL_CAPABILITIES],
  admin: ALL_CAPABILITIES.filter((c) => c !== 'manage_roles'),
  manager: [
    'view_dashboard',
    'members.view',
    'members.create',
    'members.edit',
    'members.delete',
    'manage_members',
    'manage_activities',
    'manage_formations',
    'manage_donations',
    'manage_products',
    'manage_orders',
    'manage_news',
    'manage_gallery',
    'manage_documents',
    'manage_messages',
    'messages.reply',
    'manage_beneficiaries',
    'manage_personnel',
    'view_analytics',
  ],
  editor: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_documents', 'manage_products'],
  formation_lead: ['view_dashboard', 'manage_formations', 'manage_beneficiaries', 'view_analytics'],
  finance_lead: ['view_dashboard', 'manage_donations', 'manage_orders', 'view_analytics', 'manage_settings'],
  communication_lead: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_messages', 'messages.reply'],
  viewer: ['view_dashboard', 'members.view'],
}

let permissionCache = null

export async function loadPermissions() {
  if (permissionCache) return permissionCache

  try {
    const [roles, perms, rolePerms] = await Promise.all([
      prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }),
      prisma.permission.findMany(),
      prisma.rolePermission.findMany({ include: { permission: true } }),
    ])

    const permMap = new Map(perms.map((p) => [p.key, p]))
    const roleMap = new Map()
    for (const role of roles) {
      const keys = rolePerms
        .filter((rp) => rp.roleId === role.id && rp.permission)
        .map((rp) => rp.permission.key)
      roleMap.set(String(role.name).toLowerCase(), { ...role, permissionKeys: keys })
    }

    permissionCache = { roles, perms: permMap, roleMap }
    return permissionCache
  } catch (err) {
    console.warn('Failed to load DB permissions, falling back to DEFAULT_ROLE_PERMISSIONS:', err?.message)
    return { roles: [], perms: new Map(), roleMap: new Map() }
  }
}

export async function roleCapabilities(roleName) {
  const normalized = String(roleName || '').toLowerCase()
  const fallback = DEFAULT_ROLE_PERMISSIONS[normalized] || []
  const cache = await loadPermissions()
  const role = cache.roleMap.get(normalized)
  if (!role || !Array.isArray(role.permissionKeys) || role.permissionKeys.length === 0) {
    return [...fallback]
  }
  if (role.permissionKeys.includes('*')) return [...ALL_CAPABILITIES]
  const combined = new Set([
    ...fallback,
    ...role.permissionKeys.filter((c) => ALL_CAPABILITIES.includes(c)),
  ])
  return [...combined]
}

export async function resolvePermissions(user) {
  if (!user) return []
  const base = await roleCapabilities(user.role)
  if (Array.isArray(user.permissions)) {
    return user.permissions.filter((c) => ALL_CAPABILITIES.includes(c))
  }
  if (user.permissions && typeof user.permissions === 'object') {
    const merged = new Set(base)
    if (Array.isArray(user.permissions.add)) user.permissions.add.forEach((c) => merged.add(c))
    if (Array.isArray(user.permissions.remove)) user.permissions.remove.forEach((c) => merged.delete(c))
    return [...merged].filter((c) => ALL_CAPABILITIES.includes(c))
  }
  return base
}

export async function hasPermission(user, capability) {
  if (!user) return false
  const role = String(user.role || '').toLowerCase()
  if (role === 'super_admin' || role === 'admin') return true
  const caps = await resolvePermissions(user)
  if (caps.includes('*') || caps.includes(capability)) return true
  if (capability && capability.startsWith('members.') && caps.includes('manage_members')) {
    return true
  }
  return false
}

export async function clearPermissionCache() {
  permissionCache = null
}
