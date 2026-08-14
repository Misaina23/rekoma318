'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { AdminProvider } from './AdminContext'
import { type Role } from '@/lib/roles'

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<{ email: string; role: Role; roleLabel: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

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
            <motion.div className="fixed inset-0 z-[110] lg:hidden">
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <motion.aside
                className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-2xl"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <SidebarContent role={profile.role} />
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
          <main id="admin-content" className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} role={profile.role} />
      </div>
    </AdminProvider>
  )
}
