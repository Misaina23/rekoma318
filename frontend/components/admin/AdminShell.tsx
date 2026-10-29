'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, ShoppingCart, Mail, LayoutGrid } from 'lucide-react'
import { SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { AdminProvider } from './AdminContext'
import { can, type Capability, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

const MOBILE_TABS: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  capability: Capability
}> = [
  { href: '/admin', label: 'Tableau', icon: LayoutDashboard, capability: 'view_dashboard' },
  { href: '/admin/members', label: 'Membres', icon: Users, capability: 'manage_members' },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart, capability: 'manage_orders' },
  { href: '/admin/messages', label: 'Messages', icon: Mail, capability: 'manage_messages' },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ email: string; role: Role; roleLabel: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email && d?.role) {
          setProfile({ email: d.email, role: d.role, roleLabel: d.roleLabel })
        } else {
          router.replace('/admin/login')
        }
      })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminProvider value={profile}>
      <div className="min-h-screen bg-muted/30">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-border bg-card lg:block">
          <SidebarContent role={profile.role} />
        </aside>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-[120] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <div
                className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 h-full w-[82%] max-w-[300px] border-r border-border bg-card shadow-2xl"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <SidebarContent
                  role={profile.role}
                  onNavigate={() => setMobileOpen(false)}
                  onClose={() => setMobileOpen(false)}
                />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="lg:pl-64">
          <Topbar
            role={profile.role}
            email={profile.email}
            onOpenSidebar={() => setMobileOpen(true)}
            onOpenCommand={() => setCmdOpen(true)}
          />
          <main id="admin-content" className="mx-auto max-w-7xl px-3.5 pb-24 pt-4 sm:px-6 md:pt-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Native Mobile Bottom Tab Navigation */}
        <nav
          aria-label="Navigation rapide administration"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-safe lg:hidden"
        >
          <div className="grid h-14 grid-cols-5 items-center px-1">
            {MOBILE_TABS.map((tab) => {
              const Icon = tab.icon
              const active = pathname === tab.href
              const allowed = can(profile.role, tab.capability)
              if (!allowed) return null
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 rounded-xl transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="max-w-full truncate px-1 text-[10px] font-semibold leading-tight">
                    {tab.label}
                  </span>
                </Link>
              )
            })}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-0.5 rounded-xl transition-colors',
                mobileOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="px-1 text-[10px] font-semibold leading-tight">Modules</span>
            </button>
          </div>
        </nav>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} role={profile.role} />
      </div>
    </AdminProvider>
  )
}
