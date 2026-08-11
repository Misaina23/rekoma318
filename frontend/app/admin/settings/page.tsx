'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, KeyRound, Mail, Check, X } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ROLE_LABELS, ROLE_PERMISSIONS, type Role, type Capability } from '@/lib/roles'
import { cn } from '@/lib/utils'

const CAPS: { key: Capability; label: string }[] = [
  { key: 'view_dashboard', label: 'Tableau de bord' },
  { key: 'manage_members', label: 'Membres' },
  { key: 'manage_activities', label: 'Activités' },
  { key: 'manage_formations', label: 'Formations' },
  { key: 'manage_donations', label: 'Dons' },
  { key: 'manage_news', label: 'Actualités' },
  { key: 'manage_gallery', label: 'Galerie' },
  { key: 'manage_documents', label: 'Documents' },
  { key: 'manage_messages', label: 'Messages' },
  { key: 'view_analytics', label: 'Analytics' },
  { key: 'manage_settings', label: 'Paramètres' },
  { key: 'manage_roles', label: 'Rôles' },
]

const ROLES = Object.keys(ROLE_LABELS) as Role[]

export default function SettingsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [profile, setProfile] = useState<{ email: string; role: Role; roleLabel: string } | null>(null)
  const [secret, setSecret] = useState('')

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.ok && r.json()).then(setProfile).catch(() => {})
  }, [])

  async function call(url: string, body: any, ok: string) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    if (r.ok) { toast(ok, 'success'); if (d.secret) setSecret(d.secret) }
    else toast(t.admin.save, 'error')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.nav.settings}</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Authentification</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <button onClick={() => call('/api/admin/2fa', {}, '2FA activé (démo)')} className={cn(buttonVariants({ variant: 'outline' }))}>
            <KeyRound className="h-4 w-4" /> Activer 2FA
          </button>
          <button onClick={() => call('/api/admin/verify', { code: '123456' }, 'Email vérifié (démo)')} className={cn(buttonVariants({ variant: 'outline' }))}>
            <ShieldCheck className="h-4 w-4" /> Vérifier email
          </button>
          <button onClick={() => call('/api/admin/forgot', { email: profile?.email }, 'Email envoyé (démo)')} className={cn(buttonVariants({ variant: 'outline' }))}>
            <Mail className="h-4 w-4" /> Mot de passe oublié
          </button>
        </CardContent>
        {secret && (
          <CardContent>
            <p className="text-xs text-muted-foreground">Secret TOTP (démo) :</p>
            <code className="block rounded-lg bg-secondary p-3 text-sm">{secret}</code>
          </CardContent>
        )}
      </Card>

      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-base">Profil</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p><span className="text-muted-foreground">Email :</span> {profile.email}</p>
            <p><span className="text-muted-foreground">Rôle :</span> {profile.roleLabel}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Matrice des permissions</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2 font-medium">Capacité</th>
                {ROLES.map((r) => <th key={r} className="p-2 text-center font-medium">{ROLE_LABELS[r]}</th>)}
              </tr>
            </thead>
            <tbody>
              {CAPS.map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <td className="p-2">{c.label}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="p-2 text-center">
                      {ROLE_PERMISSIONS[r].includes(c.key)
                        ? <Check className="mx-auto h-4 w-4 text-primary" />
                        : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
