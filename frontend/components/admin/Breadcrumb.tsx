'use client'

import { usePathname } from 'next/navigation'
import { useI18n } from '@/components/providers/I18nProvider'
import { NAV_ITEMS } from './nav'
import { ChevronRight } from 'lucide-react'

function labelFor(pathname: string, role: string) {
  const item = NAV_ITEMS.find((i) => i.href === pathname)
  return item?.key
}

export function Breadcrumb({ role }: { role: string }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const key = labelFor(pathname, role)
  const crumbs = ['Admin', key ? (t.admin.nav as Record<string, string>)[key] : ''].filter(Boolean)
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          <span className={i === crumbs.length - 1 ? 'font-medium text-foreground' : ''}>{c}</span>
        </span>
      ))}
    </nav>
  )
}
