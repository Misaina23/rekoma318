'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Shield } from 'lucide-react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { cn } from '@/lib/utils'

type LinkItem = { href: string; label: string }

export function MobileNav({
  open,
  onClose,
  links,
  adminLabel,
}: {
  open: boolean
  onClose: () => void
  links: LinkItem[]
  adminLabel: string
}) {
  const pathname = usePathname()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] xl:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col rounded-t-3xl border-t border-border bg-card px-5 pb-6 pt-3 shadow-2xl pb-safe sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[82%] sm:max-w-sm sm:rounded-none sm:border-l sm:border-t-0 sm:p-6">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between pb-2">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto py-1">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className={cn(
                  'flex min-h-[46px] items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/admin"
            onClick={onClose}
            className="mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Shield className="h-4 w-4" />
            {adminLabel}
          </Link>
        </nav>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <LangToggle />
          <ThemeToggle />
        </div>
      </aside>
    </div>
  )
}
