'use client'

import { MapPin, Phone, Mail, Share2 } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { PageHero } from '@/components/sections/PageHero'
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardContent } from '@/components/ui/card'
import { ContactForm } from '@/components/sections/ContactForm'

export default function ContactPage() {
  const { t } = useI18n()

  const coords = [
    { icon: MapPin, label: t.contact.address, value: t.contact.addressValue },
    { icon: Phone, label: t.contact.phone, value: t.contact.phoneValue },
    { icon: Mail, label: t.contact.emailLabel, value: t.contact.emailValue },
    { icon: Share2, label: t.contact.social, value: t.contact.socialValue },
  ]

  return (
    <>
      <PageHero eyebrow="REKOMA" title={t.contact.title} description={t.contact.lead} />

      <section className="section-pad">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <h2 className="text-xl font-semibold">{t.contact.formTitle}</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-xl font-semibold">{t.contact.coordTitle}</h2>
            <div className="mt-6 space-y-4">
              {coords.map((c) => (
                <Card key={c.label}>
                  <CardContent className="flex gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                      <p className="mt-0.5">{c.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
