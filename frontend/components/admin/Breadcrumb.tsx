'use client'

import { usePathname } from 'next/navigation'
import { useI18n } from '@/components/providers/I18nProvider'
import { NAV_ITEMS } from './nav'
import { ChevronRight } from 'lucide-react'

function labelFor(pathname: string) {
  const item = NAV_ITEMS.find((i) => i.href === pathname)
  return item?.key
}

export function Breadcrumb({ role: _role }: { role: string }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const key = labelFor(pathname)
  const pageTitle = key ? (t.admin.nav as Record<string, string>)[key] : 'Admin'
  const crumbs = ['Admin', key ? pageTitle : ''].filter(Boolean)

  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground sm:hidden">{pageTitle}</p>
      <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            <span className={i === crumbs.length - 1 ? 'truncate font-medium text-foreground' : 'shrink-0'}>
              {c}
            </span>
          </span>
        ))}
      </div>
    </nav>
  )
}
