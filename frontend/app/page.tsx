'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Hero } from '@/components/sections/Hero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { t } = useI18n()

  return (
    <>
      <Hero />

      <section className="overflow-hidden border-y border-border bg-[#f3f0e8] dark:bg-background">
        <div className="container grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="max-w-lg">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-accent" />
              REKOMA · Collection
            </p>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-tight md:text-5xl">{t.home.storeTitle}</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">{t.home.storeText}</p>
            <Link
              href="/articles"
              className="mt-7 inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-semibold text-primary transition-colors hover:border-primary"
            >
              {t.home.storeCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal>
            <Link
              href="/articles"
              className="block overflow-hidden border border-black/5 bg-[#e8e4da] p-2 shadow-[0_20px_60px_-40px_rgba(30,40,30,0.45)] md:p-3"
              aria-label={t.home.storeCta}
            >
              <Image
                src="/ARTICLE/TEE SHIRT.jpg"
                alt="Les tee-shirts REKOMA présentés en plusieurs coloris"
                width={1264}
                height={843}
                quality={95}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="h-auto w-full"
              />
            </Link>
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span>Collection REKOMA</span>
              <span>01 — Tee-shirts</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-white dark:bg-background">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="REKOMA" title={t.home.introTitle} description={t.home.introText} />
            <Link
              href="/a-propos"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
            >
              {t.common.learnMore}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Stagger className="grid gap-x-8 sm:grid-cols-2">
            {t.home.introPoints.map((point) => (
              <StaggerItem key={point}>
                <p className="border-t border-border py-4 text-sm font-medium">{point}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section-pad bg-[#f3f0e8] dark:bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={t.home.impactTitle} title={t.impact.title} description={t.home.impactText} />
          </Reveal>
          <Stagger className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.domains.map((d, idx) => {
              return (
                <StaggerItem key={d.title}>
                  <div className="h-full border-t border-border pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {String(idx + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-2 font-semibold text-foreground">{d.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{d.text}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </Stagger>
          <Reveal className="mt-10 text-center">
            <Link href="/pdima" className={cn(buttonVariants({ variant: 'default' }))}>
              {t.home.projectsTitle}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <Reveal>
            <div className="flex flex-col items-start gap-6 border-y border-border py-10 md:flex-row md:items-center md:justify-between md:py-12">
              <div className="max-w-xl">
                <h2 className="font-display text-4xl font-medium leading-[1.04] tracking-tight md:text-5xl">{t.home.partnersTitle}</h2>
                <p className="mt-3 text-muted-foreground">{t.home.partnersText}</p>
              </div>
              <Link
                href="/contact"
                className={cn(buttonVariants({ variant: 'default' }), 'h-12 shrink-0 rounded-md px-7')}
              >
                {t.home.partnersCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
