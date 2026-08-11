export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'formation_lead'
  | 'finance_lead'
  | 'communication_lead'

export type Capability =
  | 'view_dashboard'
  | 'manage_members'
  | 'manage_activities'
  | 'manage_formations'
  | 'manage_donations'
  | 'manage_news'
  | 'manage_gallery'
  | 'manage_documents'
  | 'manage_messages'
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
}

const FULL: Capability[] = [
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

export const ROLE_PERMISSIONS: Record<Role, Capability[]> = {
  super_admin: FULL,
  admin: FULL.filter((c) => c !== 'manage_roles'),
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
}

export function can(role: Role, capability: Capability): boolean {
  return ROLE_PERMISSIONS[role]?.includes(capability) ?? false
}

export function defaultRole(): Role {
  return (process.env.ADMIN_ROLE as Role) || 'super_admin'
}
