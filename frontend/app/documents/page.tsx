import { FileText, Download, Images } from 'lucide-react'
import { fr } from '@/lib/i18n'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { remoteCms } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

async function getData() {
  const [documents, gallery] = await Promise.all([
    remoteCms.documents().catch(() => []),
    remoteCms.gallery().catch(() => []),
  ])
  const photos = gallery.flatMap((e: any) => (e.photos || []).map((p: any) => ({ ...p, event: e.title })))
  return { documents, photos }
}

export default async function DocumentsPage() {
  const t = fr
  let documents: any[] = []
  let photos: any[] = []
  try {
    const data = await getData()
    documents = data.documents
    photos = data.photos
  } catch {
    // backend unreachable → show empty state instead of crashing
  }

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.documents.title} description={t.documents.lead} />

      <section className="section-pad">
        <div className="container max-w-4xl">
          <h2 className="mb-4 text-xl font-bold">Documents</h2>
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">{t.documents.note}</CardContent>
            </Card>
          ) : (
            <Stagger className="space-y-4">
              {documents.map((d: any) => (
                <StaggerItem key={d.id}>
                  <Card className="transition-transform hover:-translate-y-0.5">
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{d.title}</h3>
                          {d.category && <Badge variant="outline">{d.category}</Badge>}
                        </div>
                        {d.description && <p className="mt-1 truncate text-sm text-muted-foreground">{d.description}</p>}
                      </div>
                      {d.fileUrl ? (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-secondary"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <button
                          disabled
                          className="inline-flex h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground opacity-60"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <h2 className="mb-4 mt-12 flex items-center gap-2 text-xl font-bold">
            <Images className="h-5 w-5 text-primary" /> Galerie d&apos;événements
          </h2>
          {photos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune photo pour le moment.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {photos.map((p: any) => (
                <Reveal key={p.id}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.event || 'Événement REKOMA'} className="h-40 w-full object-cover" />
                      <p className="px-3 py-2 text-xs text-muted-foreground">{p.event}</p>
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
