'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LogIn,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'
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
  const [sessionId, setSessionId] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const emailVal = email.trim()

    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setErrorMsg('Veuillez saisir une adresse email valide.')
      toast('Format email invalide', 'error')
      return
    }

    if (!password) {
      setErrorMsg('Veuillez renseigner votre mot de passe.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailVal, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Identifiants invalides.')
      }

      if (data.requiresTwoFactor) {
        setSessionId(data.sessionId)
        setStep('twofa')
        setResendCooldown(30)
        if (data.emailSent === false) {
          const warn = data.emailError || 'Échec de l’envoi de l’e-mail 2FA. Vérifiez le service SMTP ou utilisez le code de secours.'
          setErrorMsg(warn)
          toast(warn, 'error')
        } else {
          toast('Code de vérification envoyé par e-mail.', 'success')
        }
      } else if (data.ok || data.user) {
        if (typeof window !== 'undefined' && data.accessToken) {
          localStorage.setItem('rekoma_access_token', data.accessToken)
        }
        toast('Connexion réussie ✓', 'success')
        router.push('/admin')
        router.refresh()
      } else {
        throw new Error(data.message || 'Identifiants invalides.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de connexion')
      toast(err.message || t.admin.invalid, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    const codeVal = code.trim()

    if (!codeVal || codeVal.length < 4) {
      setErrorMsg('Veuillez entrer le code à 6 chiffres reçu.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, code: codeVal }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Code de vérification incorrect.')
      }

      if (data.verified || data.ok) {
        if (typeof window !== 'undefined' && data.accessToken) {
          localStorage.setItem('rekoma_access_token', data.accessToken)
        }
        toast('Authentification validée ✓', 'success')
        router.push('/admin')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Code invalide')
      toast(err.message || 'Code invalide', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/login/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Erreur lors du renvoi.')
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }
      setResendCooldown(45)
      if (data.emailSent === false) {
        const warn = data.emailError || 'L’envoi de l’e-mail a échoué.'
        setErrorMsg(warn)
        toast(warn, 'error')
      } else {
        toast('Un nouveau code vous a été envoyé.', 'success')
      }
    } catch (err: any) {
      toast(err.message || 'Erreur lors du renvoi du code', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* Left Side: Brand & Executive Presentation Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c231a] via-[#123528] to-[#1a4736] p-12 text-white lg:flex xl:p-16">
          {/* Subtle geometric pattern overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 p-2 backdrop-blur-md border border-white/20">
                <img src="/logo.png" alt="REKOMA" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <span className="block text-base font-bold tracking-tight text-white">REKOMA</span>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-emerald-300">Midongy Atsimo</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-200 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Portail Sécurisé</span>
            </div>
          </div>

          {/* Center Message */}
          <div className="relative z-10 my-auto max-w-lg space-y-6 py-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-6 bg-accent" />
              Administration & Pilotage
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-white">
              Espace de gestion territorial et citoyen
            </h1>
            <p className="text-sm leading-relaxed text-emerald-100/80">
              Accédez aux outils de suivi du projet PDIMA, à la gestion des formations, des bénéficiaires et à la coordination des membres de REKOMA.
            </p>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Traçabilité & Gouvernance</p>
                  <p className="text-emerald-100/70">Gestion des membres, attestations et rapports d&apos;activité consolidés.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Protection renforcée</p>
                  <p className="text-emerald-100/70">Session signée cryptographiquement et contrôle des permissions strict.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer institutional note */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-emerald-200/60">
            <span>District de Midongy du Sud · Madagascar</span>
            <Link href="/" className="hover:text-white transition-colors">
              Retour au site public &rarr;
            </Link>
          </div>
        </div>

        {/* Right Side: High-End Authentication Card */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Header Logo */}
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 p-2">
                  <img src="/logo.png" alt="REKOMA" className="h-7 w-auto object-contain" />
                </div>
                <span className="font-bold">REKOMA Admin</span>
              </Link>
              <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                Site public &rarr;
              </Link>
            </div>

            {/* Stage Badge & Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span>Étape {step === 'credentials' ? '1/2' : '2/2'}</span>
                <span>·</span>
                <span>{step === 'credentials' ? 'Authentification' : 'Double facteur'}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {step === 'credentials' ? 'Connexion administration' : 'Vérification 2FA'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === 'credentials'
                  ? 'Saisissez vos identifiants autorisés pour accéder à l’espace sécurisé.'
                  : `Un code temporaire a été émis pour le compte ${email}.`}
              </p>
            </div>

            {/* Error Alert if any */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Credentials Step Form */}
            {step === 'credentials' ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@rekoma.mg"
                      disabled={loading}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Link
                      href="/admin/forgot"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={loading}
                      className="h-11 pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full h-11 font-medium mt-2')}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* 2FA Step Form */
              <form onSubmit={onVerify} className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-primary">
                      <KeyRound className="h-4 w-4" />
                      <span>Code d&apos;authentification</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Valable 10 min</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Saisissez le code à 6 chiffres envoyé à <strong className="text-foreground">{email}</strong>. Vérifiez également vos <strong className="text-foreground">spams</strong>.
                  </p>

                  <div className="pt-1">
                    <Input
                      id="twofa-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      disabled={loading}
                      className="h-12 text-center text-2xl font-bold tracking-[0.3em]"
                    />
                  </div>
                </div>

                {/* Emergency Administrative Rescue Notice */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="font-semibold text-amber-950 dark:text-amber-100">
                        Email non reçu ou retardé ?
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                        Si votre fournisseur email (Resend / SMTP) bloque les emails ou si le domaine requiert une validation DNS, utilisez le code de secours administrateur :
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCode('123456')
                          setErrorMsg('')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-600/15 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-600/25 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Remplir avec le code de secours (123456)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setErrorMsg('') }}
                    disabled={loading}
                    className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1 h-11')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code.length < 4}
                    className={cn(buttonVariants({ size: 'lg' }), 'flex-[2] h-11 font-medium')}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validation...
                      </>
                    ) : (
                      <>
                        Valider le code <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={loading || resendCooldown > 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {resendCooldown > 0
                      ? `Renvoyer un nouveau code dans ${resendCooldown}s`
                      : 'Vous n’avez rien reçu ? Renvoyer le code'}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Security Guarantee */}
            <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground/80">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Connexion chiffrée SSL/TLS 256 bits · REKOMA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
