'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="REKOMA"
      className={cn('group inline-flex shrink-0 items-center transition-opacity hover:opacity-80', className)}
    >
      <Image
        src="/logo.png"
        alt="REKOMA"
        width={1424}
        height={703}
        className="h-10 w-auto object-contain"
        priority={priority}
      />
    </Link>
  )
}
