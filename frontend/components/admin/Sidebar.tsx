'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/components/providers/I18nProvider'
import { NAV_ITEMS } from './nav'
import { can, ROLE_LABELS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

export function SidebarContent({ role }: { role: Role }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()

  function handleClick(item: typeof NAV_ITEMS[0]) {
    if (can(role, item.capability)) {
      router.push(item.href)
    } else {
      window.alert("Accès refusé\nVous n'avez pas les permissions nécessaires pour accéder à ce module.")
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="flex h-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent p-1.5">
          <img src="/logo.png" alt="REKOMA" className="h-6 w-auto" />
        </span>
        <div className="leading-none">
          <p className="text-sm font-bold">REKOMA</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((i) => {
          const active = pathname === i.href
          const authorized = can(role, i.capability)
          const Icon = i.icon
          return (
            <button
              key={i.href}
              type="button"
              onClick={() => handleClick(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active && authorized
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {(t.admin.nav as Record<string, string>)[i.key]}
              {!authorized && <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">Locked</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-secondary px-3 py-2 text-xs">
          <p className="text-muted-foreground">Rôle</p>
          <p className="font-semibold">{ROLE_LABELS[role]}</p>
        </div>
      </div>
    </div>
  )
}
