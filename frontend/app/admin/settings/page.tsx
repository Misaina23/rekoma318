'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, KeyRound, Mail, Check, X, Users, RefreshCw, UserX, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [profile, setProfile] = useState<{ email: string; role: string; roleLabel: string } | null>(null)
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
          <button onClick={async () => {
            const r = await fetch('/api/admin/2fa/toggle', { method: 'POST' })
            const d = await r.json().catch(() => ({}))
            if (r.ok) toast(`2FA ${d.twoFactorEnabled ? 'activé' : 'désactivé'}`, 'success')
            else toast(d.error || 'Erreur', 'error')
          }} className={cn(buttonVariants({ variant: 'outline' }))}>
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

      <RolesManager />
    </div>
  )
}

function RolesManager() {
  const { t } = useI18n()
  const toast = useToast()
  const [roles, setRoles] = useState<any[]>([])
  const [perms, setPerms] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  async function load() {
    const [rolesR, permsR] = await Promise.all([
      fetch('/api/admin/roles/roles').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/roles/permissions').then(r => r.ok ? r.json() : []),
    ])
    setRoles(rolesR)
    setPerms(permsR)
  }
  useEffect(() => { load() }, [])

  function openEdit(role: any) {
    setEditing(role)
    setName(role.name)
    setLabel(role.label)
    setDescription(role.description || '')
    setSelectedPerms(new Set(role.permissionKeys || []))
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setLabel('')
    setDescription('')
    setSelectedPerms(new Set())
  }

  async function submit() {
    setSaving(true)
    try {
      const body = { name, label, description, permissionKeys: [...selectedPerms] }
      const r = await fetch(editing ? `/api/admin/roles/roles/${editing.id}` : '/api/admin/roles/roles', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { toast(editing ? 'Rôle mis à jour ✓' : 'Rôle créé ✓', 'success'); openCreate(); load() }
      else toast(d.error || 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(role: any) {
    if (!(await confirmDialog('Supprimer ce rôle ?'))) return
    const r = await fetch(`/api/admin/roles/roles/${role.id}`, { method: 'DELETE' })
    if (r.ok) { toast('Rôle supprimé ✓', 'success'); load() }
    else toast('Erreur', 'error')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Rôles & permissions</CardTitle>
        <button onClick={openCreate} className={cn(buttonVariants({ size: 'sm' }))}>Nouveau rôle</button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="p-2 font-medium">Nom</th>
              <th className="p-2 font-medium">Label</th>
              <th className="p-2 font-medium">Permissions</th>
              <th className="p-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2 font-mono text-xs">{r.name}</td>
                <td className="p-2">{r.label}</td>
                <td className="p-2 text-xs text-muted-foreground">{r.permissionKeys?.length || 0} permissions</td>
                <td className="p-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(r)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} title="Éditer"><Pencil className="h-4 w-4" /></button>
                    {!r.isSystem && <button onClick={() => remove(r)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-destructive')} title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aucun rôle.</td></tr>
            )}
          </tbody>
        </table>

        {(editing !== null || name) && (
          <div className="mt-4 rounded-lg border border-border p-4">
            <h3 className="mb-3 font-medium">{editing ? 'Éditer le rôle' : 'Nouveau rôle'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom (system)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!!editing} />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-1">
                {perms.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={selectedPerms.has(p.key)} onChange={(e) => {
                      const next = new Set(selectedPerms)
                      if (e.target.checked) { next.add(p.key) } else { next.delete(p.key) }
                      setSelectedPerms(next)
                    }} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={openCreate} className={cn(buttonVariants({ variant: 'outline' }))}>Annuler</button>
              <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}>
                <Check className="h-4 w-4" /> {editing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsersManager() {
  const { t } = useI18n()
  const toast = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [perms, setPerms] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [caps, setCaps] = useState<Record<string, boolean>>({})

  async function load() {
    const [usersR, rolesR, permsR] = await Promise.all([
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/roles/roles').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/roles/permissions').then(r => r.ok ? r.json() : []),
    ])
    setUsers(usersR)
    setRoles(rolesR)
    setPerms(permsR)
  }
  useEffect(() => { load() }, [])

  function openPerms(u: any) {
    setEditId(u.id)
    const map: Record<string, boolean> = {}
    for (const c of perms.map((p: any) => p.key)) map[c] = false
    if (Array.isArray(u.permissions)) {
      for (const c of u.permissions) {
        if (map.hasOwnProperty(c)) map[c] = true
      }
    }
    setCaps(map)
  }

  async function savePerms(u: any) {
    const permissions = perms.map((p: any) => p.key).filter((k: string) => caps[k])
    const r = await fetch(`/api/admin/roles/users/${u.id}/permissions`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permissions }),
    })
    if (r.ok) { toast('Permissions enregistrées ✓', 'success'); setEditId(null); load() }
    else toast('Erreur', 'error')
  }

  async function setRole(u: any, roleId: string) {
    const r = await fetch(`/api/admin/roles/users/${u.id}/permissions`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roleId }),
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
                  <select value={u.roleId || u.role} onChange={(e) => setRole(u, e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                    {roles.map((r: any) => <option key={r.id} value={r.id}>{r.label}</option>)}
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
                        {perms.map((p: any) => (
                          <label key={p.id} className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={!!caps[p.key]} onChange={(e) => setCaps((prev) => ({ ...prev, [p.key]: e.target.checked }))} />
                            {p.label}
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
