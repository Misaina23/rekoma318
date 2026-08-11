'use client'

import { Crown, UserRound } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function initials(name: string) {
  return name
    .replace(/^(M\.|Mme|Mr\.)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function GovernancePage() {
  const { t } = useI18n()
  const g = t.governance

  const board = [g.president, g.treasurer, g.secretary, g.designer, g.advisorM, g.advisorF, g.coordinator, g.devops, g.trainer]

  return (
    <>
      <PageHero eyebrow={g.title} title={g.title} description={g.lead} />

      <section className="section-pad">
        <div className="container max-w-md">
          <Reveal>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="p-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background/20">
                  <Crown className="h-7 w-7" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] opacity-90">
                  {g.founder.role}
                </p>
                <h3 className="mt-1 text-xl font-bold">{g.founder.name}</h3>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={g.bureauTitle} title={g.bureauTitle} />
          </Reveal>
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {board.map((m) => (
              <StaggerItem key={m.name}>
                <Card className="group h-full transition-transform hover:-translate-y-1">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {initials(m.name)}
                    </span>
                    <Badge variant="muted" className="mt-4">
                      {m.role}
                    </Badge>
                    <h3 className="mt-3 font-semibold">{m.name}</h3>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section-pad">
        <div className="container max-w-3xl">
          <Reveal>
            <Card>
              <CardContent className="flex gap-4 p-6">
                <UserRound className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  REKOMA — Regroupement des Kidabo Opportunistes de Midongy Atsimo. Zone d’intervention :
                  commune rurale de Midongy Atsimo, district de Midongy du Sud (318), région
                  Atsimo-Atsinanana, Madagascar.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}
