'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

type News = { id: string; titleFr: string; excerptFr: string; tagFr?: string; date?: string }

export default function ActualitesPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cms/news')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setItems(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.actualites?.title || 'Actualités'} description={t.actualites?.lead || 'Les dernières nouvelles du projet PDIMA et de REKOMA.'} />

      <section className="section-pad">
        <div className="container max-w-4xl">
          {loading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune actualité pour le moment.</CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {items.map((n) => (
                <Reveal key={n.id}>
                  <Card className="transition hover:-translate-y-0.5">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{n.tagFr}</Badge>
                        <span>{n.date ? new Date(n.date).toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                      <h2 className="mt-2 text-xl font-bold">{n.titleFr}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{n.excerptFr}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
