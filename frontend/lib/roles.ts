export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'formation_lead'
  | 'finance_lead'
  | 'communication_lead'
  | 'viewer'

export type Capability =
  | 'view_dashboard'
  | 'manage_members'
  | 'members_view'
  | 'members_create'
  | 'members_edit'
  | 'members_delete'
  | 'manage_activities'
  | 'manage_formations'
  | 'manage_donations'
  | 'manage_news'
  | 'manage_gallery'
  | 'manage_documents'
  | 'manage_messages'
  | 'messages_reply'
  | 'manage_beneficiaries'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_roles'

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  editor: 'Éditeur',
  formation_lead: 'Responsable Formation',
  finance_lead: 'Responsable Finance',
  communication_lead: 'Responsable Communication',
  viewer: 'Observateur',
}

const FULL: Capability[] = [
  'view_dashboard',
  'manage_members',
  'members_view',
  'members_create',
  'members_edit',
  'members_delete',
  'manage_activities',
  'manage_formations',
  'manage_donations',
  'manage_news',
  'manage_gallery',
  'manage_documents',
  'manage_messages',
  'messages_reply',
  'manage_beneficiaries',
  'view_analytics',
  'manage_settings',
  'manage_roles',
]

export const ALL_CAPABILITIES: Capability[] = FULL

export const ROLE_PERMISSIONS: Record<Role, Capability[]> = {
  super_admin: FULL,
  admin: FULL.filter((c) => c !== 'manage_roles'),
  manager: [
    'view_dashboard',
    'manage_members',
    'members_view',
    'members_create',
    'members_edit',
    'members_delete',
    'manage_activities',
    'manage_formations',
    'manage_donations',
    'manage_news',
    'manage_gallery',
    'manage_documents',
    'manage_messages',
    'messages_reply',
    'manage_beneficiaries',
    'view_analytics',
  ],
  editor: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_documents'],
  formation_lead: ['view_dashboard', 'manage_formations', 'view_analytics'],
  finance_lead: ['view_dashboard', 'manage_donations', 'view_analytics', 'manage_settings'],
  communication_lead: ['view_dashboard', 'manage_news', 'manage_gallery', 'manage_messages', 'messages_reply'],
  viewer: ['view_dashboard'],
}

// Resolve effective permissions: role defaults, then per-user overrides.
export function resolvePermissions(role: Role, overrides?: string[] | { add?: string[]; remove?: string[] } | null): Capability[] {
  const base = ROLE_PERMISSIONS[role] ?? []
  if (Array.isArray(overrides)) return overrides.filter((c) => FULL.includes(c as Capability)) as Capability[]
  if (overrides && typeof overrides === 'object') {
    const set = new Set(base)
    ;(overrides.add || []).forEach((c) => set.add(c as Capability))
    ;(overrides.remove || []).forEach((c) => set.delete(c as Capability))
    return [...set]
  }
  return base
}

export function can(role: Role, capability: Capability, overrides?: string[] | { add?: string[]; remove?: string[] } | null): boolean {
  const caps = resolvePermissions(role, overrides)
  return caps.includes(capability)
}

export function defaultRole(): Role {
  return (process.env.ADMIN_ROLE as Role) || 'super_admin'
}
