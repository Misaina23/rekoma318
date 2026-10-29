'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error'

type ToastItem = {
  id: string
  message: string
  type: ToastType
}

type ConfirmState = {
  title: string
  message: string
  resolve: (confirmed: boolean) => void
}

type ToastFn = (message: string, type?: ToastType) => Promise<void>

const ToastContext = createContext<ToastFn | null>(null)

let externalPushToast: ToastFn | null = null
let externalConfirm: ((message: string, title?: string) => Promise<boolean>) | null = null

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const pushToast = useCallback<ToastFn>(
    async (message: string, type: ToastType = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev.slice(-2), { id, message, type }])
      const timer = setTimeout(() => {
        timersRef.current.delete(id)
        setToasts((prev) => prev.filter((item) => item.id !== id))
      }, 4200)
      timersRef.current.set(id, timer)
    },
    []
  )

  const openConfirm = useCallback((message: string, title = 'Confirmer') => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ title, message, resolve })
    })
  }, [])

  useEffect(() => {
    externalPushToast = pushToast
    externalConfirm = openConfirm
    const timers = timersRef.current
    return () => {
      externalPushToast = null
      externalConfirm = null
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [pushToast, openConfirm])

  function closeConfirm(result: boolean) {
    if (!confirmState) return
    const resolver = confirmState.resolve
    setConfirmState(null)
    resolver(result)
  }

  return (
    <ToastContext.Provider value={pushToast}>
      {children}

      {/* Responsive Native Mobile & Desktop Toast Stack */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-3 top-3 z-[260] flex flex-col gap-2 pt-safe sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[380px]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const isSuccess = item.type === 'success'
            return (
              <motion.div
                key={item.id}
                role="status"
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-card/95 p-3.5 shadow-xl backdrop-blur-md',
                  isSuccess
                    ? 'border-primary/35 text-card-foreground'
                    : 'border-destructive/40 text-card-foreground'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                    isSuccess
                      ? 'bg-primary/15 text-primary'
                      : 'bg-destructive/15 text-destructive'
                  )}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-semibold text-foreground">
                    {isSuccess ? 'Succès' : 'Attention'}
                  </p>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Fermer l’alerte"
                  className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Responsive Confirmation Sheet (Bottom Sheet on Mobile, Compact Dialog on Desktop) */}
      <AnimatePresence>
        {confirmState && (
          <div
            className="fixed inset-0 z-[270] flex items-end justify-center sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rekoma-confirm-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => closeConfirm(false)}
              className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 36 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-t-3xl border border-border bg-card px-5 pb-6 pt-3 shadow-2xl pb-safe sm:rounded-2xl sm:p-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="rekoma-confirm-title" className="text-base font-bold text-foreground">
                    {confirmState.title}
                  </h2>
                  <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                    {confirmState.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeConfirm(false)}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-secondary/60 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:h-10 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirm(true)}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 sm:h-10 sm:w-auto"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  return useCallback<ToastFn>(
    async (message: string, type: ToastType = 'success') => {
      if (ctx) {
        await ctx(message, type)
      } else if (externalPushToast) {
        await externalPushToast(message, type)
      }
    },
    [ctx]
  )
}

export async function confirmDialog(message: string, title = 'Confirmer'): Promise<boolean> {
  if (externalConfirm) {
    return externalConfirm(message, title)
  }
  return false
}
