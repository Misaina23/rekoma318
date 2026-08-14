'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Doc = { id: string; title: string; description?: string; fileUrl?: string; category?: string }
type Photo = { id: string; url: string; event?: string }

export default function DocumentsPage() {
  const { t } = useI18n()
  const [documents, setDocuments] = useState<Doc[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/cms/documents').then((r) => r.ok ? r.json() : []),
      fetch('/api/cms/gallery').then((r) => r.ok ? r.json() : []),
    ])
      .then(([docs, gallery]) => {
        setDocuments(docs || [])
        const photos = (gallery || []).flatMap((e: any) => (e.photos || []).map((p: any) => ({ ...p, event: e.title })))
        setPhotos(photos)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.documents.title} description={t.documents.lead} />

      <section className="section-pad">
        <div className="container max-w-4xl">
          <h2 className="mb-4 text-xl font-bold">Documents</h2>
          {loading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">{t.documents.note}</CardContent>
            </Card>
          ) : (
            <Stagger className="space-y-4">
              {documents.map((d) => (
                <StaggerItem key={d.id}>
                  <Card className="transition-transform hover:-translate-y-0.5">
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{d.title}</h3>
                          {d.category && <Badge variant="outline">{d.category}</Badge>}
                        </div>
                        {d.description && <p className="mt-1 truncate text-sm text-muted-foreground">{d.description}</p>}
                      </div>
                      {d.fileUrl ? (
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-secondary">PDF</a>
                      ) : (
                        <button disabled className="inline-flex h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground opacity-60">PDF</button>
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <h2 className="mb-4 mt-12 flex items-center gap-2 text-xl font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            Galerie d&apos;événements
          </h2>
          {loading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : photos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune photo pour le moment.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {photos.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <img src={p.url} alt={p.event || 'Événement REKOMA'} className="h-40 w-full object-cover" />
                    <p className="px-3 py-2 text-xs text-muted-foreground">{p.event}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
