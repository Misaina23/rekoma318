'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '@/components/providers/I18nProvider'
import { searchIndex } from '@/lib/search'
import { cn } from '@/lib/utils'

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) {
      setQ('')
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return searchIndex
    return searchIndex.filter((e) =>
      [e.fr, e.en, e.keywords].some((s) => s.toLowerCase().includes(term))
    )
  }, [q])

  function go(href: string) {
    router.push(href)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-foreground/40 px-4 pt-24 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search.placeholder}
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button onClick={onClose} aria-label="close" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t.search.empty}</li>
              )}
              {results.map((r) => (
                <li key={r.href}>
                  <button
                    onClick={() => go(r.href)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-secondary'
                    )}
                  >
                    <span className="font-medium">{locale === 'fr' ? r.fr : r.en}</span>
                    <span className="text-xs text-muted-foreground">{r.href}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
