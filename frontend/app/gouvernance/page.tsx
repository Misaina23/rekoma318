'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = {
  id: string
  firstName: string
  lastName: string
  sex: 'M' | 'F'
  role: string | null
  designation: string | null
  description: string | null
  photo: string | null
  displayOrder: number
}

export default function GovernancePage() {
  const { t } = useI18n()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/members/public')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch((e) => { console.error('Failed to load members:', e); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => a.displayOrder - b.displayOrder || a.lastName.localeCompare(b.lastName))
  }, [members])

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.nav.governance || 'Gouvernance'} description={t.governance?.lead || 'Découvrez les membres de notre organisation.'} />

      <section className="section-pad">
        <div className="container">
          <SectionHeading align="center" eyebrow={t.governance?.title || 'Gouvernance'} title={t.governance?.title || 'Gouvernance'} description={t.governance?.lead || 'Les personnes qui composent notre gouvernance et assurent notre pilotage stratégique.'} />

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">Aucun membre à afficher pour le moment.</p>
          ) : (
            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((m) => (
                <StaggerItem key={m.id}>
                  <Card className="h-full transition-transform hover:-translate-y-1">
                    <CardContent className="flex gap-4 p-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                        {m.photo ? (
                          <img src={m.photo} alt={`${m.firstName} ${m.lastName}`} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          `${m.firstName[0]}${m.lastName[0]}`
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{m.firstName} {m.lastName}</h3>
                        {(m.designation || m.role) && (
                          <p className="text-sm text-primary">{m.designation || m.role}</p>
                        )}
                        {m.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
                        )}
                        <div className="mt-2">
                          <Badge variant="muted" className="text-xs">{m.sex === 'F' ? 'Femme' : 'Homme'}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </>
  )
}
