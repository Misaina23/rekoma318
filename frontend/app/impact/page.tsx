'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/motion/AnimatedCounter'
import { Loader2 } from 'lucide-react'

type Counter = { value: number; suffix?: string; range?: string; label: string }

export default function ImpactPage() {
  const { t } = useI18n()
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/public')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        setCounters([
          { value: data.beneficiaries || 0, suffix: '+', label: 'Bénéficiaires' },
          { value: data.activeMembers || 0, suffix: '+', label: 'Membres actifs' },
          { value: data.formations || 0, suffix: '', label: 'Formations réalisées' },
          { value: data.validatedDonations || 0, suffix: '', label: 'Dons validés' },
        ])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHero eyebrow="PDIMA" title={t.impact.title} description={t.impact.lead} />

      <section className="section-pad">
        <div className="container grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {counters.map((c, i) => (
            <StaggerItem key={i}>
              <Card className="h-full text-center">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                    {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /> : <AnimatedCounter value={c.value} suffix={c.suffix || '+'} range={String(c.value)} />}
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.impact.lead}</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {counters.map((c, i) => (
              <StaggerItem key={i}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-primary">
                      {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : <AnimatedCounter value={c.value} suffix={c.suffix || '+'} range={String(c.value)} />}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.label}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  )
}
