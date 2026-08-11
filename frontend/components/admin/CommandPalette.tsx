'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { NAV_ITEMS } from './nav'
import { can, type Role, type Capability } from '@/lib/roles'
import { cn } from '@/lib/utils'

type Action = { href: string; label: string; hint?: string; icon?: ReactNode; capability?: Capability }

export function CommandPalette({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const { t } = useI18n()
  const router = useRouter()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) setQ('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const actions: Action[] = useMemo(() => {
    const nav: Action[] = NAV_ITEMS.filter((i) => can(role, i.capability)).map((i) => ({
      href: i.href,
      label: (t.admin.nav as Record<string, string>)[i.key],
      icon: <i.icon className="h-4 w-4" />,
    }))
    const quick: Action[] = [
      { href: '/admin/members?new=1', label: `+ ${t.admin.new} — ${t.admin.nav.members}`, capability: 'manage_members' as Capability },
      { href: '/admin/messages', label: t.admin.nav.messages, capability: 'manage_messages' as Capability },
      { href: '/don', label: 'Site public · Faire un don' },
    ].filter((a) => !a.capability || can(role, a.capability as Capability))
    return [...nav, ...quick]
  }, [role, t])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(term))
  }, [q, actions])

  function go(href: string) {
    router.push(href)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center bg-foreground/40 px-4 pt-24 backdrop-blur-sm"
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
                placeholder={t.admin.command}
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t.search.empty}</li>
              )}
              {results.map((a) => (
                <li key={a.href}>
                  <button
                    onClick={() => go(a.href)}
                    className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-secondary')}
                  >
                    <span className="flex items-center gap-3">
                      {a.icon}
                      {a.label}
                    </span>
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
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
