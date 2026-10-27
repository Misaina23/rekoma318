'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  const { t } = useI18n()
  const animationRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const animation = animationRef.current
    if (!animation) return
    animation.muted = true
    void animation.play().catch((error: unknown) => {
      console.warn('The REKOMA hero animation could not start:', error)
    })
  }, [])

  return (
    <section className="bg-background">
      <div className="container grid items-center gap-10 py-14 md:py-20 lg:min-h-[600px] lg:grid-cols-2 lg:gap-16">
        <div className="relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-fit border-l-2 border-accent pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
          >
            Association · Midongy Atsimo · Madagascar
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 max-w-2xl text-balance text-4xl font-bold leading-[1.04] tracking-tight md:text-5xl xl:text-6xl"
          >
            {t.home.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg"
          >
            {t.home.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/a-propos"
              className={cn(buttonVariants({ size: 'lg' }), 'rounded-md px-7')}
            >
              {t.home.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/articles" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-md px-7')}>
              {t.home.ctaSecondary}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="w-full"
        >
          <div className="relative aspect-[1.6] w-full overflow-hidden rounded-lg bg-secondary">
            <video
              ref={animationRef}
              src="/mdg318-animation.mp4"
              poster="/mdg318-extrait.jpg"
              aria-label="Animation silencieuse des paysages de Midongy Atsimo"
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            Midongy Atsimo · Région Atsimo-Atsinanana
          </p>
        </motion.div>
      </div>
    </section>
  )
}
