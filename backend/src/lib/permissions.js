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
  'manage_news',
  'manage_gallery',
  'manage_documents',
  'manage_messages',
  'messages.reply',
  'manage_beneficiaries',
  'view_analytics',
  'manage_settings',
  'manage_roles',
]

let permissionCache = null

export async function loadPermissions() {
  if (permissionCache) return permissionCache

  const [roles, perms, rolePerms] = await Promise.all([
    prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }),
    prisma.permission.findMany(),
    prisma.rolePermission.findMany({ include: { permission: true } }),
  ])

  const permMap = new Map(perms.map(p => [p.key, p]))
  const roleMap = new Map()
  for (const role of roles) {
    const keys = rolePerms
      .filter(rp => rp.roleId === role.id)
      .map(rp => rp.permission.key)
    roleMap.set(role.name, { ...role, permissionKeys: keys })
  }

  permissionCache = { roles, perms: permMap, roleMap }
  return permissionCache
}

export async function roleCapabilities(roleName) {
  const cache = await loadPermissions()
  const role = cache.roleMap.get(roleName)
  if (!role) return []
  if (role.permissionKeys.includes('*')) return [...ALL_CAPABILITIES]
  return role.permissionKeys.filter(c => ALL_CAPABILITIES.includes(c))
}

export async function resolvePermissions(user) {
  if (!user) return []
  const base = await roleCapabilities(user.role)
  if (user.permissions && typeof user.permissions === 'object') {
    const merged = new Set(base)
    if (Array.isArray(user.permissions.add)) user.permissions.add.forEach(c => merged.add(c))
    if (Array.isArray(user.permissions.remove)) user.permissions.remove.forEach(c => merged.delete(c))
    return [...merged].filter(c => ALL_CAPABILITIES.includes(c))
  }
  return base
}

export async function hasPermission(user, capability) {
  if (!user) return false
  const caps = await resolvePermissions(user)
  return caps.includes('*') || caps.includes(capability)
}

export async function clearPermissionCache() {
  permissionCache = null
}
