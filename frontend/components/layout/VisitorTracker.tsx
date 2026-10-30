'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'anon'
  try {
    const existing = window.localStorage.getItem('rekoma_visitor_id')
    if (existing) return existing
    const created = `v_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`
    window.localStorage.setItem('rekoma_visitor_id', created)
    return created
  } catch {
    return 'anon'
  }
}

export function VisitorTracker() {
  const pathname = usePathname()
  const lastTrackedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (lastTrackedRef.current === pathname) return
    lastTrackedRef.current = pathname

    const visitorId = getOrCreateVisitorId()
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: pathname, visitorId }),
    }).catch(() => {})
  }, [pathname])

  return null
}
