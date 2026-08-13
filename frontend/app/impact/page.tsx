import { PageHero } from '@/components/sections/PageHero'
import { AnimatedCounter } from '@/components/motion/AnimatedCounter'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { fr } from '@/lib/i18n'
import { remoteBeneficiaries, remoteMembers, remoteDonations, remoteFormations } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [ben, members, donations, formations] = await Promise.all([
    remoteBeneficiaries.stats().catch(() => ({ total: 0, breakdown: {} })),
    remoteMembers.list().catch(() => []),
    remoteDonations.list().catch(() => ({ donations: [], totalCollected: 0 })),
    remoteFormations.list().catch(() => []),
  ])
  const activeMembers = members.filter((m: any) => m.status !== 'inactive').length
  const validatedDonations = donations.donations?.filter((d: any) => d.status === 'validated').length || 0
  return [
    { value: ben.total || 0, label: 'Bénéficiaires' },
    { value: activeMembers, label: 'Membres actifs' },
    { value: formations.length, label: 'Formations réalisées' },
    { value: validatedDonations, label: 'Dons validés', suffix: '' },
  ]
}

export default async function ImpactPage() {
  const t = fr.impact
  const counters = await getStats()

  return (
    <>
      <PageHero eyebrow="PDIMA" title={t.title} description={t.lead} />

      <section className="section-pad">
        <div className="container grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {counters.map((c, i) => (
            <StaggerItem key={i}>
              <Card className="h-full text-center">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                    <AnimatedCounter value={c.value} suffix={c.suffix || '+'} range={String(c.value)} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.lead}</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {counters.map((c, i) => (
              <StaggerItem key={i}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-primary">
                      <AnimatedCounter value={c.value} suffix={c.suffix || '+'} range={String(c.value)} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.label}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  )
}
