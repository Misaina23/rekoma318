'use client'

import { Compass, Eye, Target, Heart } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  const { t } = useI18n()

  const blocks = [
    { icon: Compass, title: t.about.historyTitle, text: t.about.history },
    { icon: Target, title: t.about.missionTitle, text: t.about.mission },
    { icon: Eye, title: t.about.visionTitle, text: t.about.vision },
  ]

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.about.title} description={t.about.lead} />

      <section className="section-pad">
        <div className="container space-y-5">
          {blocks.map((b, i) => (
            <Reveal key={i}>
              <Card>
                <CardContent className="flex gap-5 p-6 md:p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <b.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold">{b.title}</h2>
                    <p className="mt-2 text-muted-foreground">{b.text}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow={t.about.valuesTitle} title={t.about.valuesTitle} />
            <Stagger className="mt-6 space-y-3">
              {t.about.values.map((v) => (
                <StaggerItem key={v}>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Heart className="h-4 w-4 text-accent" />
                    <span className="font-medium">{v}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
          <Reveal>
            <SectionHeading eyebrow={t.about.zoneTitle} title={t.about.zoneTitle} />
            <p className="mt-4 text-muted-foreground">{t.about.zone}</p>
            <Stagger className="mt-6 space-y-3">
              {t.about.zoneItems.map((z) => (
                <StaggerItem key={z}>
                  <div className="rounded-xl border border-border bg-card p-4 text-sm font-medium">
                    {z}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        </div>
      </section>
    </>
  )
}
