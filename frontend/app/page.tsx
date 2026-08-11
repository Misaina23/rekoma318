'use client'

import Link from 'next/link'
import {
  ArrowRight,
  HeartHandshake,
  Leaf,
  Sprout,
  Users,
  Droplets,
  GraduationCap,
  Bike,
  Store,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Hero } from '@/components/sections/Hero'
import { StatsBand } from '@/components/sections/StatsBand'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const axisIcons = [Store, Bike, Leaf, Sprout, Droplets, GraduationCap, Users]

export default function HomePage() {
  const { t } = useI18n()

  return (
    <>
      <Hero />
      <StatsBand />

      <section className="section-pad">
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
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {t.home.introPoints.map((p) => (
              <StaggerItem key={p}>
                <Card className="h-full transition-transform hover:-translate-y-1">
                  <CardContent className="flex items-start gap-3 p-5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Leaf className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-medium">{p}</p>
                  </CardContent>
                </Card>
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
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.pdima.axes.slice(0, 6).map((a, i) => {
              const Icon = axisIcons[i]
              return (
                <StaggerItem key={a.n}>
                  <Card className="h-full transition-transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-semibold">{a.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
                    </CardContent>
                  </Card>
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
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.home.partnersTitle}</h2>
                  <p className="mt-3 text-primary-foreground/90">{t.home.partnersText}</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-background px-7 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                >
                  <HeartHandshake className="h-4 w-4" />
                  {t.home.partnersCta}
                </Link>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}
