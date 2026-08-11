'use client'

import { Newspaper, Images, FileText } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Card, CardContent } from '@/components/ui/card'

const ICONS = { news: Newspaper, gallery: Images, documents: FileText }

export function ModulePlaceholder({ kind, note }: { kind: 'news' | 'gallery' | 'documents'; note: string }) {
  const { t } = useI18n()
  const Icon = ICONS[kind]
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t.admin.nav[kind]}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">{note}</p>
        </CardContent>
      </Card>
    </div>
  )
}
