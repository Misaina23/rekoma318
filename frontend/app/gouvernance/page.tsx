import { Crown, UserRound } from 'lucide-react'
import { fr } from '@/lib/i18n'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { remoteMembers } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

function initials(name: string) {
  return name
    .replace(/^(M\.|Mme|Mr\.)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default async function GovernancePage() {
  const g = fr.governance
  const members = await remoteMembers.public().catch(() => [])

  return (
    <>
      <PageHero eyebrow={g.title} title={g.title} description={g.lead} />

      <section className="section-pad">
        <div className="container max-w-md">
          <Reveal>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="p-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background/20">
                  <Crown className="h-7 w-7" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] opacity-90">
                  {g.founder.role}
                </p>
                <h3 className="mt-1 text-xl font-bold">{g.founder.name}</h3>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="section-pad bg-secondary/40">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionHeading align="center" eyebrow={g.bureauTitle} title={g.bureauTitle} />
          </Reveal>
          {members.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucun membre actif pour le moment.</CardContent>
            </Card>
          ) : (
            <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m: any) => (
                <StaggerItem key={m.id}>
                  <Card className="group h-full transition-transform hover:-translate-y-1">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt={`${m.firstName} ${m.lastName}`} className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {initials(`${m.firstName} ${m.lastName}`)}
                        </span>
                      )}
                      <Badge variant="muted" className="mt-4">
                        {m.designation || m.role || ''}
                      </Badge>
                      <h3 className="mt-3 font-semibold">{m.firstName} {m.lastName}</h3>
                      {m.description && <p className="mt-2 text-xs text-muted-foreground">{m.description}</p>}
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      <section className="section-pad">
        <div className="container max-w-3xl">
          <Reveal>
            <Card>
              <CardContent className="flex gap-4 p-6">
                <UserRound className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  REKOMA — Regroupement des Kidabo Opportunistes de Midongy Atsimo. Zone d’intervention :
                  commune rurale de Midongy Atsimo, district de Midongy du Sud (318), région
                  Atsimo-Atsinanana, Madagascar.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}
