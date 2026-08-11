'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Search, LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Breadcrumb } from './Breadcrumb'
import { Notifications } from './Notifications'
import { LangToggle } from '@/components/layout/LangToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ROLE_LABELS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function Topbar({
  role,
  email,
  onOpenSidebar,
  onOpenCommand,
}: {
  role: Role
  email: string
  onOpenSidebar: () => void
  onOpenCommand: () => void
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      <button onClick={onOpenSidebar} className="flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden" aria-label="Menu">
        <Menu className="h-4 w-4" />
      </button>
      <Breadcrumb role={role} />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenCommand}
          className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>{t.admin.search}</span>
          <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
        </button>
        <button onClick={onOpenCommand} aria-label={t.admin.search} className="flex h-9 w-9 items-center justify-center rounded-full border border-border sm:hidden">
          <Search className="h-4 w-4" />
        </button>

        <Notifications />
        <LangToggle className="hidden md:flex" />
        <ThemeToggle />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 hover:bg-secondary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
              {initials(email || 'RK')}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-xs font-semibold">{email}</span>
              <span className="block text-[10px] text-muted-foreground">{ROLE_LABELS[role]}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              <Link href="/admin/settings" onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary">
                <SettingsIcon className="h-4 w-4" /> {t.admin.nav.settings}
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm text-destructive hover:bg-secondary">
                <LogOut className="h-4 w-4" /> {t.admin.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
