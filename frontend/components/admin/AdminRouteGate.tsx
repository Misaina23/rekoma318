'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { AdminShell } from '@/components/admin/AdminShell'

// Routes under /admin that must NOT be guarded (public auth screens).
const PUBLIC = ['/admin/login', '/admin/forgot', '/admin/verify']

export function AdminRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) return <>{children}</>
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  )
}
