'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, KeyRound, Mail, Check, X, Users, RefreshCw, UserX } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ROLE_LABELS, ROLE_PERMISSIONS, ALL_CAPABILITIES, type Role, type Capability } from '@/lib/roles'
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

      <UsersManager />

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

const ROLE_OPTIONS: Role[] = ['super_admin', 'admin', 'manager', 'editor', 'formation_lead', 'finance_lead', 'communication_lead', 'viewer']

function UsersManager() {
  const { t } = useI18n()
  const toast = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [caps, setCaps] = useState<Record<string, boolean>>({})

  async function load() {
    const r = await fetch('/api/admin/users')
    if (r.ok) setUsers(await r.json())
  }
  useEffect(() => { load() }, [])

  function openPerms(u: any) {
    setEditId(u.id)
    const base = ROLE_PERMISSIONS[(u.role as Role)] ?? []
    const map: Record<string, boolean> = {}
    for (const c of ALL_CAPABILITIES) map[c] = base.includes(c as Capability)
    // apply custom overrides
    if (Array.isArray(u.permissions)) u.permissions.forEach((c: string) => (map[c] = true))
    setCaps(map)
  }

  async function savePerms(u: any) {
    const permissions = ALL_CAPABILITIES.filter((c) => caps[c])
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permissions }),
    })
    if (r.ok) { toast('Permissions enregistrées ✓', 'success'); setEditId(null); load() }
    else toast('Erreur', 'error')
  }

  async function setRole(u: any, role: string) {
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (r.ok) { toast('Rôle mis à jour ✓', 'success'); load() }
    else toast('Erreur', 'error')
  }

  async function toggleActive(u: any) {
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    })
    if (r.ok) load()
    else toast('Erreur', 'error')
  }

  async function resetPwd(u: any) {
    const r = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    if (r.ok) toast(`Mot de passe réinitialisé: ${d.temporaryPassword}`, 'success')
    else toast('Erreur', 'error')
  }

  async function remove(u: any) {
    if (!(await confirmDialog('Supprimer cet utilisateur ?'))) return
    const r = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    if (r.ok) load()
    else toast('Erreur', 'error')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Utilisateurs du tableau de bord</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="p-2 font-medium">Email</th>
              <th className="p-2 font-medium">Rôle</th>
              <th className="p-2 font-medium">Dernier accès</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border align-top">
                <td className="p-2">{u.email}<br /><span className="text-xs text-muted-foreground">{u.name}</span></td>
                <td className="p-2">
                  <select value={u.role} onChange={(e) => setRole(u, e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </td>
                <td className="p-2 text-xs text-muted-foreground">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                <td className="p-2">
                  <button onClick={() => toggleActive(u)} className={cn('rounded-full px-3 py-1 text-xs font-medium', u.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    {u.active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openPerms(u)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} title="Permissions"><ShieldCheck className="h-4 w-4" /></button>
                    <button onClick={() => resetPwd(u)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} title="Réinitialiser le mot de passe"><RefreshCw className="h-4 w-4" /></button>
                    <button onClick={() => remove(u)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-destructive')} title="Supprimer"><UserX className="h-4 w-4" /></button>
                  </div>
                  {editId === u.id && (
                    <div className="mt-2 rounded-lg border border-border p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Permissions personnalisées</p>
                      <div className="grid grid-cols-2 gap-1">
                        {ALL_CAPABILITIES.map((c) => (
                          <label key={c} className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={!!caps[c]} onChange={(e) => setCaps((p) => ({ ...p, [c]: e.target.checked }))} />
                            {c}
                          </label>
                        ))}
                      </div>
                      <button onClick={() => savePerms(u)} className={cn(buttonVariants({ size: 'sm' }), 'mt-2')}>Enregistrer</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun utilisateur.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
