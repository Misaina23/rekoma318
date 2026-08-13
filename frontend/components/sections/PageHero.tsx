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
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      </div>
      <div className="container py-16 md:py-20">
        <Reveal className="max-w-3xl space-y-4">
          {eyebrow && (
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </span>
          )}
          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">{String(title)}</h1>
          {description && (
            <p className="text-balance text-lg text-muted-foreground">{String(description)}</p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
