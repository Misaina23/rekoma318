'use client'

import Link from 'next/link'
import {
  Target,
  Lightbulb,
  Recycle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HandHeart,
  Mail,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PdimaPage() {
  const { t } = useI18n()
  const p = t.pdima

  return (
    <>
      <PageHero eyebrow={p.subtitle} title={p.title} description={p.intro} />

      {/* 3 piliers essentiels */}
      <section className="section-pad">
        <div className="container grid gap-6 md:grid-cols-3">
          <Reveal>
            <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-lg">{p.contextTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.context}</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-lg">{p.solutionTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.solutions}</p>
              </CardContent>
            </Card>
          </Reveal>
          <Reveal delay={0.16}>
            <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-lg">{p.objectivesTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.objectives}</p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Problématiques et Résultats cibles */}
      <section className="section-pad bg-secondary/40">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow={p.problemTitle} title={p.problemTitle} />
            <Stagger className="mt-6 space-y-3">
              {p.problems.map((pr) => (
                <StaggerItem key={pr}>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm leading-relaxed text-foreground">{pr}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow={p.resultsTitle} title={p.resultsTitle} />
            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-relaxed">
                  <strong className="font-semibold text-foreground">50–70</strong> emplois directs créés et soutenus localement (avec au moins 50 % de jeunes et de femmes).
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-relaxed">
                  <strong className="font-semibold text-foreground">500–800</strong> ménages desservis durablement en eau potable salubre.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-relaxed">
                  <strong className="font-semibold text-foreground">100–150</strong> personnes formées par an aux métiers ruraux, techniques agricoles et gestion.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm leading-relaxed">
                  <strong className="font-semibold text-foreground">−40 %</strong> de pénurie de denrées vivrières et légumes frais sur les marchés locaux.
                </span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Durabilité */}
      <section className="section-pad">
        <div className="container">
          <Reveal>
            <Card className="border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardContent className="flex flex-col gap-5 p-8 sm:flex-row sm:items-start md:p-10">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Recycle className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{p.sustainabilityTitle}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{p.sustainability}</p>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Appel à l'action / Partenariat */}
      <section className="section-pad border-t border-border bg-card">
        <div className="container">
          <Reveal>
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Soutenir le Projet PDIMA</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  Partenaires institutionnels, bailleurs, associations et citoyens : contribuez à transformer durablement le quotidien de Midongy Atsimo.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <Link
                  href="/contact"
                  className={cn(buttonVariants({ variant: 'default' }), 'min-h-[44px] px-6')}
                >
                  <Mail className="h-4 w-4" />
                  Nous contacter
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/don"
                  className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[44px] px-6')}
                >
                  <HandHeart className="h-4 w-4" />
                  Faire un don
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
