'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useI18n } from '@/components/providers/I18nProvider'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

function BuiltByBadge({ label }: { label: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        'bg-[linear-gradient(110deg,transparent_30%,hsl(var(--primary)/0.18)_50%,transparent_70%)] bg-[length:200%_100%] animate-shimmer'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {label}
    </motion.span>
  )
}

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  const quick = [
    { href: '/', label: t.nav.home },
    { href: '/a-propos', label: t.nav.about },
    { href: '/pdima', label: t.nav.pdima },
    { href: '/impact', label: t.nav.impact },
  ]
  const resources = [
    { href: '/gouvernance', label: t.nav.governance },
    { href: '/documents', label: t.nav.documents },
    { href: '/actualites', label: 'Actualités' },
    { href: '/contact', label: t.nav.contact },
  ]

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
          <BuiltByBadge label={t.footer.builtBy} />
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">{t.footer.quickLinks}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {quick.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">{t.footer.resources}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {resources.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">{t.footer.contactUs}</h4>
          <address className="space-y-2.5 text-sm not-italic text-muted-foreground">
            <p>Nosifeno — Midongy Atsimo</p>
            <p>Atsimo-Atsinanana, Madagascar</p>
            <Link href="/contact" className="block transition-colors hover:text-primary">
              {t.nav.contact}
            </Link>
          </address>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} REKOMA. {t.footer.rights}
          </p>
          <BuiltByBadge label={t.footer.builtBy} />
        </div>
      </div>
    </footer>
  )
}
