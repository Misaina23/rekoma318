'use client'

import { useState, type FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const search = useSearchParams()
  const toast = useToast()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = search.get('token')
    if (q) setToken(q)
  }, [search])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (password.length < 8) {
        toast('Le mot de passe doit contenir au moins 8 caractères', 'error')
        return
      }
      if (password !== confirm) {
        toast('Les mots de passe ne correspondent pas', 'error')
        return
      }
      const r = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast(data.message || 'Erreur', 'error')
        return
      }
      toast('Mot de passe réinitialisé', 'success')
      router.push('/admin/login')
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
          <h1 className="mt-4 text-2xl font-bold">Réinitialiser le mot de passe</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmer</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading || !token} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            <KeyRound className="h-4 w-4" /> Réinitialiser
          </button>
          <div className="text-center">
            <Link href="/admin/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
