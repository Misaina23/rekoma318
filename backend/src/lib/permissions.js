// RBAC: maps dashboard roles to granular capabilities and resolves effective
// permissions for a user (role defaults + optional per-user overrides).

export const ROLE_PERMISSIONS = {
  super_admin: '*', // wildcard = all permissions
  admin: [
    'view_dashboard',
    'manage_members',
    'manage_activities',
    'manage_formations',
    'manage_donations',
    'manage_news',
    'manage_gallery',
    'manage_documents',
    'manage_messages',
    'view_analytics',
    'manage_settings',
  ],
  manager: [
    'view_dashboard',
    'manage_members',
    'manage_activities',
    'manage_formations',
    'manage_donations',
    'manage_news',
    'manage_gallery',
    'manage_documents',
    'manage_messages',
    'view_analytics',
  ],
  editor: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_documents'],
  formation_lead: ['view_dashboard', 'manage_formations', 'view_analytics'],
  finance_lead: ['view_dashboard', 'manage_donations', 'view_analytics', 'manage_settings'],
  communication_lead: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_messages'],
  viewer: ['view_dashboard'],
}

export const ALL_CAPABILITIES = [
  'view_dashboard',
  'manage_members',
  'manage_activities',
  'manage_formations',
  'manage_donations',
  'manage_news',
  'manage_gallery',
  'manage_documents',
  'manage_messages',
  'view_analytics',
  'manage_settings',
  'manage_roles',
]

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

export function roleCapabilities(role) {
  const caps = ROLE_PERMISSIONS[role]
  if (caps === '*') return [...ALL_CAPABILITIES]
  return caps ? [...caps] : []
}

// Resolve effective permissions: role defaults, then apply per-user overrides.
export function resolvePermissions(user) {
  if (!user) return []
  const base = roleCapabilities(user.role)
  const overrides = user.permissions
  if (Array.isArray(overrides)) {
    // explicit list replaces role defaults (custom permission set)
    return overrides.filter((c) => ALL_CAPABILITIES.includes(c))
  }
  if (overrides && typeof overrides === 'object') {
    const merged = new Set(base)
    if (Array.isArray(overrides.add)) overrides.add.forEach((c) => merged.add(c))
    if (Array.isArray(overrides.remove)) overrides.remove.forEach((c) => merged.delete(c))
    return [...merged].filter((c) => ALL_CAPABILITIES.includes(c))
  }
  return base
}

export function hasPermission(user, capability) {
  if (!user) return false
  const caps = resolvePermissions(user)
  return caps.includes('*') || caps.includes(capability)
}
