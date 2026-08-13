'use client'

import { useState, useEffect } from 'react'
import { HeartHandshake, Smartphone, CreditCard, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { remotePayments } from '@/lib/server/remote'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const PRESETS = [5000, 10000, 25000, 50000, 100000]

type Step = 'form' | 'processing' | 'success' | 'error'

export default function DonPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ donor: '', email: '', phone: '', amount: 10000, method: 'mvola', message: '' })
  const [mvolaRef, setMvolaRef] = useState('')
  const [mvolaInstruction, setMvolaInstruction] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.donor || !form.email || !form.amount) {
      toast(t.contact.required, 'error')
      return
    }
    setError('')
    setSaving(true)

    try {
      if (form.method === 'mvola') {
        const r = await remotePayments.mvolaRequest({
          donor: form.donor,
          email: form.email,
          phone: form.phone,
          amount: form.amount,
          description: form.message || 'Don REKOMA',
        })
        if (r?.id) {
          setMvolaRef(r.reference || r.id)
          setMvolaInstruction(r.next?.instruction || 'Initiation envoyée. Confirmez sur votre téléphone MVola.')
          setStep('success')
          toast('Don initié ✓', 'success')
        } else {
          throw new Error(r?.error || 'Échec de l\'initiation MVola')
        }
      } else {
        const r = await remotePayments.stripeCheckout({
          donor: form.donor,
          email: form.email,
          phone: form.phone,
          amount: form.amount,
          description: form.message || 'Don REKOMA',
        })
        if (r?.clientSecret) {
          setClientSecret(r.clientSecret)
          setStep('success')
        } else {
          throw new Error(r?.error || 'Impossible de créer le paiement')
        }
      }
    } catch (e: any) {
      setError(e.message || 'Erreur')
      setStep('error')
      toast(error || 'Erreur', 'error')
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
          {step === 'form' && (
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
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</> : <><HeartHandshake className="h-4 w-4 mr-2" /> Faire un don</>}
              </button>
            </form>
          )}

          {step === 'success' && form.method === 'mvola' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="text-xl font-bold">Don enregistré</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Référence : <code className="rounded bg-secondary px-2 py-1">{mvolaRef}</code></p>
                <p>{mvolaInstruction}</p>
                <p>Vous recevrez une confirmation par email.</p>
              </div>
            </div>
          )}

          {step === 'success' && form.method === 'stripe' && clientSecret && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center">Paiement sécurisé</h2>
              <p className="text-sm text-muted-foreground text-center">Vos informations de carte sont chiffrées par Stripe.</p>
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: 'var(--primary)' } } }}
              >
                <StripeCheckoutForm amount={form.amount} onDone={() => { setStep('success'); setClientSecret(''); setForm({ donor: '', email: '', phone: '', amount: 10000, method: 'mvola', message: '' }) }} />
              </Elements>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4 text-center">
              <p className="text-destructive">Erreur : {error}</p>
              <button onClick={() => setStep('form')} className={cn(buttonVariants({ variant: 'outline' }))}>Réessayer</button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StripeCheckoutForm({ amount, onDone }: { amount: number; onDone: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const toast = useToast()
  const { t } = useI18n()
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function pay() {
    if (!stripe || !elements) return
    setProcessing(true)
    setErrorMsg('')
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      })
      if (error) {
        setErrorMsg(error.message || 'Erreur de paiement')
        toast(error.message || 'Erreur', 'error')
      } else {
        toast('Don validé ✓', 'success')
        onDone()
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <PaymentElement />
      </div>
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <button onClick={pay} disabled={processing} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
        {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</> : <><Lock className="mr-2 h-4 w-4" /> Payer {amount.toLocaleString()} Ar</>}
      </button>
    </div>
  )
}
