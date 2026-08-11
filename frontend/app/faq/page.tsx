'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

export default function FaqPage() {
  const { t } = useI18n()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <>
      <PageHero eyebrow="FAQ" title={t.faq.title} description={t.faq.lead} />

      <section className="section-pad">
        <div className="container max-w-3xl">
          <div className="space-y-3">
            {t.faq.items.map((item, i) => {
              const isOpen = open === i
              return (
                <Reveal key={i}>
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    >
                      <span className="font-medium">{item.q}</span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <p className="px-5 pb-5 text-sm text-muted-foreground">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
