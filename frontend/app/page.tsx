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

      <section className="border-y border-border bg-white dark:bg-background">
        <div className="container grid items-center gap-8 py-12 md:grid-cols-[1fr_1.2fr] md:py-16">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">REKOMA · Collection</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{t.home.storeTitle}</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{t.home.storeText}</p>
            <Link href="/articles" className={cn(buttonVariants({ variant: 'outline' }), 'mt-5 rounded-md')}>
              {t.home.storeCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/articles" className="relative col-span-2 aspect-[2.4] overflow-hidden bg-secondary/60">
              <Image src="/ARTICLE/TEE SHIRT.jpg" alt="Tee-shirt de la collection REKOMA" fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover" />
            </Link>
            <Link href="/articles" className="relative aspect-[1.4] overflow-hidden bg-secondary/60">
              <Image src="/ARTICLE/POLO.jpg" alt="Polo de la collection REKOMA" fill sizes="(min-width: 768px) 300px, 50vw" className="object-cover" />
            </Link>
            <Link href="/articles" className="relative aspect-[1.4] overflow-hidden bg-secondary/60">
              <Image src="/ARTICLE/BLOUSON TEDDY 2.jpg" alt="Blouson Teddy de la collection REKOMA" fill sizes="(min-width: 768px) 300px, 50vw" className="object-cover" />
            </Link>
          </div>
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

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={t.home.impactTitle} title={t.impact.title} description={t.home.impactText} />
          </Reveal>
          <Stagger className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {t.pdima.axes.slice(0, 6).map((a) => {
              return (
                <StaggerItem key={a.n}>
                  <div className="h-full border-t border-border pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Axe {String(a.n).padStart(2, '0')}
                    </p>
                    <h3 className="mt-3 font-semibold">{a.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{a.text}</p>
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
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.home.partnersTitle}</h2>
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
