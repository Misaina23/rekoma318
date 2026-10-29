'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Stagger, StaggerItem } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

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
      .then((data) => {
        setMembers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((e) => {
        console.error('Failed to load members:', e)
        setLoading(false)
      })
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
      <PageHero
        eyebrow="REKOMA"
        title={t.nav.governance || 'Gouvernance'}
        description={t.governance?.lead || 'Découvrez les membres de notre organisation.'}
      />

      <section className="section-pad">
        <div className="container">
          <SectionHeading
            align="center"
            eyebrow={t.governance?.title || 'Gouvernance'}
            title={t.governance?.title || 'Gouvernance'}
            description={
              t.governance?.lead ||
              'Les personnes qui composent notre gouvernance et assurent notre pilotage stratégique.'
            }
          />

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">Aucun membre à afficher pour le moment.</p>
          ) : (
            <Stagger className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {sorted.map((m) => {
                const initialFirst = (m.firstName?.trim()?.[0] || 'R').toUpperCase()
                const initialLast = (m.lastName?.trim()?.[0] || 'K').toUpperCase()
                const initials = `${initialFirst}${initialLast}`

                return (
                  <StaggerItem key={m.id}>
                    <Card className="h-full border border-border/80 bg-card transition-transform duration-200 hover:-translate-y-0.5">
                      <CardContent className="flex h-full flex-col justify-between p-4 sm:p-6">
                        <div className="flex gap-3.5 sm:gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary sm:h-16 sm:w-16 sm:text-xl">
                            {m.photo ? (
                              <img
                                src={m.photo}
                                alt={`${m.firstName} ${m.lastName}`}
                                referrerPolicy="no-referrer"
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold leading-snug text-foreground">
                              {m.firstName} {m.lastName}
                            </h3>
                            {(m.designation || m.role) && (
                              <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-primary sm:text-sm">
                                {m.designation || m.role}
                              </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span>{m.sex === 'F' ? 'Femme' : 'Homme'}</span>
                              {m.role && m.designation && m.role !== m.designation && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{m.role}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {m.description && (
                          <div className="mt-3.5 border-t border-border/60 pt-3">
                            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
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
