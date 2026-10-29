'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, Home, Compass, ShoppingBag, HeartHandshake, LayoutGrid } from 'lucide-react'
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
      { href: '/articles', label: t.nav.articles },
      { href: '/gouvernance', label: t.nav.governance },
      { href: '/documents', label: t.nav.documents },
      { href: '/actualites', label: 'Actualités' },
      { href: '/contact', label: t.nav.contact },
    ],
    [t.nav.about, t.nav.articles, t.nav.contact, t.nav.documents, t.nav.governance, t.nav.home, t.nav.pdima]
  )

  const mobileTabs = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/pdima', label: 'PDIMA', icon: Compass },
    { href: '/articles', label: 'Boutique', icon: ShoppingBag },
    { href: '/don', label: 'Soutenir', icon: HeartHandshake },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="container flex h-[54px] items-center justify-between gap-3 md:h-[72px] md:gap-4">
          <Logo priority />

          <nav className="hidden items-center gap-2 xl:flex">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch
                  className={cn(
                    'relative whitespace-nowrap px-2.5 py-2 text-xs font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {String(l.label)}
                  {active && (
                    <span className="absolute inset-x-2.5 -bottom-px h-px bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-transparent text-foreground transition-colors hover:bg-secondary"
            >
              <Search className="h-4 w-4" />
            </button>
            <LangToggle className="hidden sm:flex" />
            <ThemeToggle />
            <Link
              href="/admin"
              prefetch
              className="hidden h-10 items-center whitespace-nowrap rounded-xl border border-border px-4 text-xs font-semibold transition-colors hover:bg-secondary md:flex"
            >
              {t.nav.admin}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-transparent text-foreground transition-colors hover:bg-secondary xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Native Mobile Bottom Tab Bar on Smartphones */}
      <nav
        aria-label="Navigation principale mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-safe md:hidden"
      >
        <div className="grid h-14 grid-cols-5 items-center px-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon
            const active = pathname === tab.href
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
            <span className="px-1 text-[10px] font-semibold leading-tight">Plus</span>
          </button>
        </div>
      </nav>

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
