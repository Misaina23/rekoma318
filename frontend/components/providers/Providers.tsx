'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { I18nProvider } from './I18nProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  )
}
