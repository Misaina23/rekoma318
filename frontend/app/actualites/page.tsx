import { fr } from '@/lib/i18n'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { remoteCms } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export default async function ActualitesPage() {
  const items = await remoteCms.news().catch(() => [])

  return (
    <>
      <PageHero eyebrow="REKOMA" title="Actualités" description="Les dernières nouvelles du projet PDIMA et de REKOMA." />

      <section className="section-pad">
        <div className="container max-w-4xl">
          {items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune actualité pour le moment.</CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {items.map((n: any) => (
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
