'use client'

import Link from 'next/link'
import { useI18n } from '@/components/providers/I18nProvider'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <Link
      href="/"
      aria-label="REKOMA"
      className={cn('group flex items-center gap-2.5', className)}
    >
      <span className="relative flex h-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent p-1.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
        <img src="/logo.png" alt="REKOMA" className="h-7 w-auto" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">REKOMA</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t.footer.tagline.split(' ').slice(0, 2).join(' ')}
        </span>
      </span>
    </Link>
  )
}
