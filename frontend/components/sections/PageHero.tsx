'use client'

import { Reveal } from '@/components/motion/Reveal'

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <section className="border-b border-border bg-[#f3f0e8] dark:bg-background">
      <div className="container py-16 md:py-24">
        <Reveal className="max-w-3xl space-y-5">
          {eyebrow && (
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
          )}
          <h1 className="text-balance font-display text-5xl font-medium leading-[0.98] tracking-tight md:text-7xl">{String(title)}</h1>
          {description && (
            <p className="max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">{String(description)}</p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
