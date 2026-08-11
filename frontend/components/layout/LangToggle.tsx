'use client'

import { useI18n } from '@/components/providers/I18nProvider'
import { cn } from '@/lib/utils'

export function LangToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  return (
    <div
      className={cn(
        'relative flex h-10 items-center rounded-full border border-border bg-background/60 p-1 text-xs font-semibold',
        className
      )}
    >
      <button
        onClick={() => setLocale('fr')}
        className={cn(
          'relative z-10 flex h-8 items-center gap-1 rounded-full px-3 transition-colors',
          locale === 'fr' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        🇫🇷 FR
      </button>
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'relative z-10 flex h-8 items-center gap-1 rounded-full px-3 transition-colors',
          locale === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        🇬🇧 EN
      </button>
      <span
        className="absolute top-1 bottom-1 w-[52px] rounded-full bg-primary transition-transform duration-300"
        style={{ transform: locale === 'en' ? 'translateX(50px)' : 'translateX(0)' }}
      />
    </div>
  )
}
