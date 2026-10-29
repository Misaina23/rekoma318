'use client'

import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { NAV_ITEMS } from './nav'
import { can, ROLE_LABELS, type Role } from '@/lib/roles'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function SidebarContent({
  role,
  onNavigate,
  onClose,
}: {
  role: Role
  onNavigate?: () => void
  onClose?: () => void
}) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  function handleClick(item: (typeof NAV_ITEMS)[0]) {
    if (can(role, item.capability)) {
      router.push(item.href)
      onNavigate?.()
    } else {
      toast("Accès refusé : vous n'avez pas les permissions nécessaires pour accéder à ce module.", 'error')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-border px-4 md:h-16 md:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent p-1.5">
            <img src="/logo.png" alt="REKOMA" className="h-6 w-auto" />
          </span>
          <div className="leading-none">
            <p className="text-sm font-bold">REKOMA</p>
            <p className="text-[11px] text-muted-foreground">Administration</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
                'flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                active && authorized
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{(t.admin.nav as Record<string, string>)[i.key]}</span>
              {!authorized && <span className="ml-auto shrink-0 text-[11px] opacity-60">Verrouillé</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-3 pb-safe">
        <div className="rounded-xl bg-secondary px-3 py-2.5 text-xs">
          <p className="text-muted-foreground">Rôle actif</p>
          <p className="font-semibold">{ROLE_LABELS[role]}</p>
        </div>
      </div>
    </div>
  )
}
