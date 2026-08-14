'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { AnimatedCounter } from '@/components/motion/AnimatedCounter'
import { Reveal } from '@/components/motion/Reveal'

type Counter = { value: number; suffix?: string; range?: string; label: string }

export function StatsBand() {
  const { t } = useI18n()
  const [counters, setCounters] = useState<Counter[]>([])

  useEffect(() => {
    fetch('/api/stats/public')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        const next: Counter[] = [
          { value: data.beneficiaries || 0, suffix: '+', label: 'Bénéficiaires' },
          { value: data.activeMembers || 0, suffix: '+', label: 'Membres actifs' },
          { value: data.formations || 0, suffix: '', label: 'Formations réalisées' },
          { value: data.validatedDonations || 0, suffix: '', label: 'Dons validés' },
        ]
        setCounters(next)
      })
      .catch(() => {
        setCounters(t.impact?.counters || [])
      })
  }, [t.impact?.counters])

  if (counters.length === 0) return null

  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {counters.map((c, i) => (
          <Reveal key={i} delay={i * 0.08} className="text-center">
            <div className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
              <AnimatedCounter value={c.value} suffix={c.suffix} range={c.range} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
