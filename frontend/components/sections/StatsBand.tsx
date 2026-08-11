'use client'

import { useI18n } from '@/components/providers/I18nProvider'
import { AnimatedCounter } from '@/components/motion/AnimatedCounter'
import { Reveal } from '@/components/motion/Reveal'

export function StatsBand() {
  const { t } = useI18n()
  const counters = t.impact.counters

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
