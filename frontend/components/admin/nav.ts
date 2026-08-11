import {
  LayoutDashboard,
  Users,
  Mail,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Newspaper,
  Images,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { Capability } from '@/lib/roles'

export type NavItem = {
  href: string
  key: string
  icon: LucideIcon
  capability: Capability
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard, capability: 'view_dashboard' },
  { href: '/admin/members', key: 'members', icon: Users, capability: 'manage_members' },
  { href: '/admin/messages', key: 'messages', icon: Mail, capability: 'manage_messages' },
  { href: '/admin/activities', key: 'activities', icon: CalendarDays, capability: 'manage_activities' },
  { href: '/admin/formations', key: 'formations', icon: GraduationCap, capability: 'manage_formations' },
  { href: '/admin/donations', key: 'donations', icon: HeartHandshake, capability: 'manage_donations' },
  { href: '/admin/news', key: 'news', icon: Newspaper, capability: 'manage_news' },
  { href: '/admin/gallery', key: 'gallery', icon: Images, capability: 'manage_gallery' },
  { href: '/admin/documents', key: 'documents', icon: FileText, capability: 'manage_documents' },
  { href: '/admin/analytics', key: 'analytics', icon: BarChart3, capability: 'view_analytics' },
  { href: '/admin/settings', key: 'settings', icon: Settings, capability: 'manage_settings' },
]
