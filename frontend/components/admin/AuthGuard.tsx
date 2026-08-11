'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => setState(r.ok ? 'ok' : 'denied'))
      .catch(() => setState('denied'))
  }, [])

  useEffect(() => {
    if (state === 'denied') router.replace('/admin/login')
  }, [state, router])

  if (state !== 'ok') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <>{children}</>
}
