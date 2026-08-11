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
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="text-balance text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </Reveal>
  )
}
