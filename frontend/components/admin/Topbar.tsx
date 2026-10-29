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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b border-border bg-card/90 px-3 backdrop-blur-md md:h-16 md:gap-3 md:px-6">
      <button
        onClick={onOpenSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <Breadcrumb role={role} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenCommand}
          className="hidden items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>{t.admin.search}</span>
          <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
        </button>
        <button
          onClick={onOpenCommand}
          aria-label={t.admin.search}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <Notifications />
        <LangToggle className="hidden md:flex" />
        <ThemeToggle />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex h-10 items-center gap-2 rounded-xl border border-border px-1.5 hover:bg-secondary sm:pl-1.5 sm:pr-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
              {initials(email || 'RK')}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[140px] truncate text-xs font-semibold">{email}</span>
              <span className="block text-[10px] text-muted-foreground">{ROLE_LABELS[role]}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="border-b border-border px-4 py-2.5 sm:hidden">
                <p className="truncate text-xs font-semibold text-foreground">{email}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role]}</p>
              </div>
              <Link
                href="/admin/settings"
                onClick={() => setMenu(false)}
                className="flex min-h-[44px] items-center gap-2.5 px-4 py-3 text-sm hover:bg-secondary"
              >
                <SettingsIcon className="h-4 w-4" /> {t.admin.nav.settings}
              </Link>
              <button
                onClick={logout}
                className="flex min-h-[44px] w-full items-center gap-2.5 border-t border-border px-4 py-3 text-sm text-destructive hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> {t.admin.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
