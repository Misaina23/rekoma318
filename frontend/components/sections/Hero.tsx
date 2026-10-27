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
    <section className="relative isolate flex min-h-[580px] items-center overflow-hidden bg-[#17251e] text-white md:min-h-[680px]">
      <video
        ref={animationRef}
        src="/mdg318-animation.mp4"
        poster="/mdg318-extrait.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-fit items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-white/85"
          >
            <span className="h-px w-8 bg-accent" />
            Association · Midongy Atsimo · Madagascar
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-7 max-w-[780px] text-balance font-display text-5xl font-medium leading-[0.96] tracking-[-0.035em] md:text-7xl xl:text-8xl"
          >
            {t.home.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-balance text-base leading-7 text-white/85 md:text-lg"
          >
            {t.home.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link
              href="/a-propos"
              className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-sm bg-[#f3eee4] px-7 text-[#20372a] shadow-none hover:bg-white hover:shadow-none')}
            >
              {t.home.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/articles" className="inline-flex h-12 items-center px-2 text-sm font-medium text-white underline decoration-white/50 underline-offset-8 transition-colors hover:decoration-white">
              {t.home.ctaSecondary}
            </Link>
          </motion.div>
        </div>
      </div>
      <p className="absolute bottom-6 right-6 z-10 hidden text-xs uppercase tracking-[0.16em] text-white/75 md:block">
        Midongy Atsimo · Région Atsimo-Atsinanana
      </p>
    </section>
  )
}
