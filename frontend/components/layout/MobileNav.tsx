'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
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
    <div className="fixed inset-0 z-[80] lg:hidden">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col gap-2 border-l border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={onClose} aria-label="close" className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {links.map((l) => {
                const active = pathname === l.href
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onClose}
                    className={cn(
                      'rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      active ? 'bg-secondary text-primary' : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    {l.label}
                  </Link>
                )
              })}
              <Link
                href="/admin"
                onClick={onClose}
                className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground"
              >
                {adminLabel}
              </Link>
            </nav>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <LangToggle />
              <ThemeToggle />
            </div>
          </aside>
        </div>
  )
}
