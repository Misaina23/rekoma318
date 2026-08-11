'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ForgotPage() {
  const { t } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/admin/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (r.ok) toast('Email de réinitialisation envoyé (démo).', 'success')
      else toast(t.admin.invalid, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent p-2 shadow-lg">
            <img src="/logo.png" alt="REKOMA" className="h-8 w-auto" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Mot de passe oublié</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.admin.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rekoma.mg" />
          </div>
          <button type="submit" disabled={loading} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            <Mail className="h-4 w-4" /> Envoyer
          </button>
          <div className="text-center">
            <Link href="/admin/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
