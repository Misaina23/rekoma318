'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { VisitorTracker } from '@/components/layout/VisitorTracker'

export function RouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <VisitorTracker />
      <Header />
      <main id="content">{children}</main>
      <Footer />
    </>
  )
}
