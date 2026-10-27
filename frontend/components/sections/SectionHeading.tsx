'use client'

import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        'space-y-3',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance font-display text-4xl font-medium leading-[1.04] tracking-tight md:text-5xl">{title}</h2>
      {description && (
        <p className="text-balance text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </Reveal>
  )
}
