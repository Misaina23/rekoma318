'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Bell, Mail } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { AnimatePresence, motion } from 'framer-motion'

type Msg = { id: string; name: string; subject: string; createdAt: string; read: boolean; archived?: boolean }

export function Notifications() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Msg[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/messages')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Msg[]) => setItems(data.filter((m) => !m.read && !m.archived).slice(0, 5)))
      .catch(() => {})
  }, [open])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = items.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.admin.notifications}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">{t.admin.notifications}</div>
            <div className="max-h-80 overflow-y-auto">
              {unread === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t.admin.noMessages}</p>
              ) : (
                items.map((m) => (
                  <Link
                    key={m.id}
                    href="/admin/messages"
                    onClick={() => setOpen(false)}
                    className="flex gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-secondary"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium">{m.name}</p>
                      <p className="truncate text-muted-foreground">{m.subject || t.contact.message}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
