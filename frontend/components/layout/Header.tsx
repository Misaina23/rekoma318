'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { cn } from '@/lib/utils'

const MobileNav = dynamic(() => import('./MobileNav').then((mod) => mod.MobileNav), {
  ssr: false,
  loading: () => null,
})

const GlobalSearch = dynamic(() => import('./GlobalSearch').then((mod) => mod.GlobalSearch), {
  ssr: false,
  loading: () => null,
})

export function Header() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = useMemo(
    () => [
      { href: '/', label: t.nav.home },
      { href: '/a-propos', label: t.nav.about },
      { href: '/pdima', label: t.nav.pdima },
      { href: '/impact', label: t.nav.impact },
      { href: '/gouvernance', label: t.nav.governance },
      { href: '/documents', label: t.nav.documents },
      { href: '/actualites', label: 'Actualités' },
      { href: '/don', label: t.nav.don },
      { href: '/contact', label: t.nav.contact },
    ],
    [t.nav.about, t.nav.contact, t.nav.documents, t.nav.don, t.nav.governance, t.nav.home, t.nav.impact, t.nav.pdima]
  )

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {l.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="search"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-foreground transition-colors hover:bg-secondary"
            >
              <Search className="h-4 w-4" />
            </button>
            <LangToggle className="hidden sm:flex" />
            <ThemeToggle />
            <Link
              href="/admin"
              prefetch
              className="hidden h-10 items-center rounded-full bg-secondary px-4 text-sm font-medium transition-colors hover:bg-secondary/70 md:flex"
            >
              {t.nav.admin}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-foreground transition-colors hover:bg-secondary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={links}
        adminLabel={t.nav.admin}
      />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
