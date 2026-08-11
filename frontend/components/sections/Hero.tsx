'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-light bg-[size:38px_38px] dark:bg-grid-dark opacity-60" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container flex flex-col items-center pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Association · Midongy Atsimo · Madagascar
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
        >
          {t.home.heroTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl"
        >
          {t.home.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/a-propos" className={cn(buttonVariants({ size: 'lg' }))}>
            {t.home.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            {t.home.ctaSecondary}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
