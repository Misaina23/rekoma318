'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

let counted = false

export function VisitorTracker() {
  const pathname = usePathname()
  useEffect(() => {
    if (counted || pathname?.startsWith('/admin')) return
    counted = true
    fetch('/api/visits', { method: 'POST' }).catch(() => {})
  }, [pathname])
  return null
}
