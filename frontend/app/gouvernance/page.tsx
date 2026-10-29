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
    fetch('/api/members/public', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch((e) => { console.error('Failed to load members:', e); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999) ||
        String(a.lastName || '').localeCompare(String(b.lastName || ''))
    )
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
            <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((m) => {
                const initialFirst = (m.firstName?.trim()?.[0] || 'R').toUpperCase()
                const initialLast = (m.lastName?.trim()?.[0] || 'K').toUpperCase()
                const initials = `${initialFirst}${initialLast}`

                return (
                  <StaggerItem key={m.id}>
                    <Card className="h-full border border-border/80 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                      <CardContent className="flex flex-col justify-between h-full p-6">
                        <div className="flex gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary shadow-inner">
                            {m.photo ? (
                              <img src={m.photo} alt={`${m.firstName} ${m.lastName}`} className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-foreground text-base leading-snug">
                              {m.firstName} {m.lastName}
                            </h3>
                            {(m.designation || m.role) && (
                              <p className="mt-1 text-xs font-semibold text-primary line-clamp-2">
                                {m.designation || m.role}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="muted" className="text-[11px] px-2 py-0.5">
                                {m.sex === 'F' ? 'Femme' : 'Homme'}
                              </Badge>
                              {m.role && m.designation && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0.5">
                                  {m.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {m.description && (
                          <div className="mt-4 pt-3 border-t border-border/60">
                            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                              {m.description}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </StaggerItem>
                )
              })}
            </Stagger>
          )}
        </div>
      </section>
    </>
  )
}
