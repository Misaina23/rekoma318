'use client'

import { useState } from 'react'
import { HeartHandshake, CreditCard, Smartphone } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PRESETS = [5000, 10000, 25000, 50000, 100000]

export default function DonPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({ donor: '', email: '', phone: '', amount: 10000, method: 'mvola', message: '' })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.donor || !form.email || !form.amount) {
      toast(t.contact.required, 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      toast(t.admin.validated === 'Validé' ? 'Merci pour votre don !' : 'Don enregistré. Merci !', 'success')
      setForm({ ...form, message: '' })
    } catch {
      toast(t.contact.error, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container max-w-3xl py-16">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartHandshake className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">Soutenir REKOMA</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Votre don finance le projet PDIMA et le développement de Midongy Atsimo.
        </p>
      </div>

      <Card className="mt-10">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.admin.donor}</Label>
                <Input value={form.donor} onChange={(e) => set('donor', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.contact.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.contact.phone}</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+261 ..." />
            </div>

            <div className="space-y-2">
              <Label>{t.admin.amount} (Ar)</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button type="button" key={p} onClick={() => set('amount', p)}
                    className={cn('rounded-full border px-4 py-2 text-sm', form.amount === p ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary')}>
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} className="mt-2" />
            </div>

            <div className="space-y-2">
              <Label>{t.admin.method}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => set('method', 'mvola')}
                  className={cn('flex items-center justify-center gap-2 rounded-xl border p-4', form.method === 'mvola' ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary')}>
                  <Smartphone className="h-5 w-5" /> MVola
                </button>
                <button type="button" onClick={() => set('method', 'stripe')}
                  className={cn('flex items-center justify-center gap-2 rounded-xl border p-4', form.method === 'stripe' ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary')}>
                  <CreditCard className="h-5 w-5" /> Stripe
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t.contact.message}</Label>
              <Textarea value={form.message} onChange={(e) => set('message', e.target.value)} />
            </div>

            <button type="submit" disabled={saving} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              <HeartHandshake className="h-4 w-4" /> {saving ? t.contact.sending : 'Faire un don'}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Paiement sécurisé — intégration Stripe / MVola à activer côté serveur.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
