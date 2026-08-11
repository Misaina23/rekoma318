'use client'

import { FileText, Download } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DocumentsPage() {
  const { t } = useI18n()

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.documents.title} description={t.documents.lead} />

      <section className="section-pad">
        <div className="container max-w-4xl">
          <Stagger className="space-y-4">
            {t.documents.items.map((d) => (
              <StaggerItem key={d.title}>
                <Card className="transition-transform hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{d.title}</h3>
                        <Badge variant="outline">{d.tag}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{d.desc}</p>
                    </div>
                    <button
                      disabled
                      title={t.documents.note}
                      className="inline-flex h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="mt-8">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {t.documents.note}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}
