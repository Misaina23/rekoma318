'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, KeyRound } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'twofa'>('credentials')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const emailVal = email.trim()
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        toast('Format email invalide', 'error')
        return
      }
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { toast(data.message || t.admin.invalid, 'error'); return }
      setStep('twofa')
    } catch {
      toast(t.admin.invalid, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!r.ok) { toast(t.admin.invalid, 'error'); return }
      router.push('/admin')
      router.refresh()
    } catch {
      toast(t.admin.invalid, 'error')
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
          <h1 className="mt-4 text-2xl font-bold">{t.admin.loginTitle}</h1>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.admin.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rekoma.mg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.admin.password}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Voir le mot de passe'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17.94 17.94A10 10 0 0 1 6.06 6.06" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              <LogIn className="h-4 w-4" /> {t.admin.submit}
            </button>
            <div className="text-center">
              <Link href="/admin/forgot" className="text-sm text-primary hover:underline">{t.admin.nav.settings} · Mot de passe oublié</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4" /> Vérification à deux facteurs (démo)
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" autoFocus />
            </div>
            <button type="submit" disabled={loading} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              {t.admin.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
