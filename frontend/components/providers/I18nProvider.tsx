'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { dictionaries, type Locale } from '@/lib/i18n'

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: typeof dictionaries.fr
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const stored = (typeof window !== 'undefined' &&
      window.localStorage.getItem('rekoma-locale')) as Locale | null
    if (stored === 'fr' || stored === 'en') setLocaleState(stored)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rekoma-locale', l)
      document.documentElement.lang = l
    }
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
