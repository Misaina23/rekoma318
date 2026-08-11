'use client'

import {
  Store,
  Bike,
  Leaf,
  Sprout,
  Droplets,
  GraduationCap,
  Users,
  Target,
  Lightbulb,
  CalendarClock,
  Recycle,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const axisIcons = [Store, Bike, Leaf, Sprout, Droplets, GraduationCap, Users]

export default function PdimaPage() {
  const { t } = useI18n()
  const p = t.pdima

  return (
    <>
      <PageHero eyebrow={p.subtitle} title={p.title} description={p.intro} />

      <section className="section-pad">
        <div className="container grid gap-6 md:grid-cols-3">
          <Reveal>
            <Card className="h-full">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.contextTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.context}</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.solutionTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.solutions}</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.16}>
            <Card className="h-full">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.objectivesTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.objectives}</p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={p.axesTitle} title={p.axesTitle} />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {p.axes.map((a, i) => {
              const Icon = axisIcons[i]
              return (
                <StaggerItem key={a.n}>
                  <Card className="group h-full transition-transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </span>
                        <Badge variant="muted">0{a.n}</Badge>
                      </div>
                      <h3 className="mt-4 font-semibold leading-snug">{a.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      </section>

      <section className="section-pad">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow={p.problemTitle} title={p.problemTitle} />
            <Stagger className="mt-6 space-y-3">
              {p.problems.map((pr) => (
                <StaggerItem key={pr}>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    <span className="text-sm">{pr}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
          <Reveal>
            <SectionHeading eyebrow={p.resultsTitle} title={p.resultsTitle} />
            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="font-semibold text-foreground">50–70</span> emplois directs (≥ 50 % jeunes et femmes)
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="font-semibold text-foreground">500–800</span> ménages desservis en eau potable
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="font-semibold text-foreground">100–150</span> personnes formées par an
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="font-semibold text-foreground">−40 %</span> de pénurie de légumes sur les marchés
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={p.calendarTitle} title={p.calendarTitle} />
          </Reveal>
          <div className="relative mx-auto mt-12 max-w-3xl">
            <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border md:left-1/2" />
            {p.phases.map((ph, i) => (
              <Reveal key={i} className="relative mb-8 flex gap-6 md:items-center">
                <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <Card className="flex-1">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{ph.name}</h3>
                      <Badge>{ph.months}</Badge>
                    </div>
                    <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                      {ph.items.map((it) => (
                        <li key={it} className="flex gap-2">
                          <span className="text-primary">•</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <Reveal>
            <Card className="border-0 bg-gradient-to-br from-primary/10 to-accent/10">
              <CardContent className="flex gap-5 p-8 md:p-10">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Recycle className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{p.sustainabilityTitle}</h2>
                  <p className="mt-2 text-muted-foreground">{p.sustainability}</p>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}
