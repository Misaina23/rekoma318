'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, Download, X, Check, UserRound } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Member = {
  id: string
  firstName: string
  lastName: string
  sex: 'M' | 'F'
  role: string
  designation?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  status: 'active' | 'inactive'
  displayOrder?: number
  joinedAt: string
  photo?: string
}

export default function MembersPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Member | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [userTarget, setUserTarget] = useState<Member | null>(null)
  const pageSize = 8

  async function load() {
    const r = await fetch('/api/admin/members')
    if (r.ok) setMembers(await r.json())
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter((m) => {
      if (status !== 'all' && m.status !== status) return false
      if (!term) return true
      return `${m.firstName} ${m.lastName} ${m.email} ${m.role}`.toLowerCase().includes(term)
    })
  }, [members, q, status])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const view = filtered.slice((page - 1) * pageSize, page * pageSize)

  function exportCsv() {
    const head = ['firstName', 'lastName', 'sex', 'role', 'address', 'phone', 'email', 'status', 'joinedAt']
    const rows = filtered.map((m) => head.map((h) => `"${String((m as any)[h] ?? '').replace(/"/g, '""')}"`).join(','))
    const csv = [head.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'membres.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    const r = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' })
    if (r.ok) { toast(t.admin.delete + ' ✓', 'success'); load() }
    else toast(t.admin.delete, 'error')
  }

  function openCreateUser(m: Member) {
    setUserTarget(m)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.members}</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Plus className="h-4 w-4" /> {t.admin.new}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={t.admin.search} className="pl-9" />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setPage(1) }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t.admin.status}</option>
          <option value="active">{t.admin.active}</option>
          <option value="inactive">{t.admin.inactive}</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">{t.admin.lastName}</th>
                  <th className="p-4 font-medium">{t.admin.function}</th>
                  <th className="p-4 font-medium">{t.admin.phone}</th>
                  <th className="p-4 font-medium">{t.admin.email}</th>
                  <th className="p-4 font-medium">{t.admin.status}</th>
                  <th className="p-4 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {view.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{m.firstName} {m.lastName}</td>
                    <td className="p-4 text-muted-foreground">{m.role}</td>
                    <td className="p-4 text-muted-foreground">{m.phone}</td>
                    <td className="p-4 text-muted-foreground">{m.email}</td>
                    <td className="p-4">
                      <Badge variant={m.status === 'active' ? 'default' : 'muted'}>
                        {m.status === 'active' ? t.admin.active : t.admin.inactive}
                      </Badge>
                    </td>
                   <td className="p-4">
                     <div className="flex justify-end gap-1">
                       <button onClick={() => { setEditing(m); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary" aria-label={t.admin.edit}>
                         <Pencil className="h-4 w-4" />
                       </button>
                       <button onClick={() => openCreateUser(m)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))} title="Créer un utilisateur" aria-label="Créer un utilisateur">
                         <UserRound className="h-4 w-4" />
                       </button>
                       <button onClick={() => remove(m.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary" aria-label={t.admin.delete}>
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </td>
                  </tr>
                ))}
                {view.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t.search.empty}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>{t.admin.back}</button>
          <span className="text-sm text-muted-foreground">{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>{t.admin.page}</button>
        </div>
      )}

      {showForm && (
        <MemberForm
          member={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}

      {userTarget && (
        <CreateUserModal
          member={userTarget}
          onClose={() => setUserTarget(null)}
          onSaved={() => setUserTarget(null)}
        />
      )}
    </div>
  )
}

function MemberForm({ member, onClose, onSaved }: { member: Member | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    sex: member?.sex || 'M',
    role: member?.role || '',
    designation: member?.designation || '',
    displayOrder: member?.displayOrder ?? 999,
    description: member?.description || '',
    address: member?.address || '',
    phone: member?.phone || '',
    email: member?.email || '',
    status: member?.status || 'active',
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    const method = member ? 'PUT' : 'POST'
    const url = member ? `/api/admin/members/${member.id}` : '/api/admin/members'
    const r = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (r.ok) { toast(t.admin.save + ' ✓', 'success'); onSaved() }
    else toast(t.admin.save, 'error')
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{member ? t.admin.edit : t.admin.new}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.admin.firstName}</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.admin.lastName}</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.admin.sex}</Label>
              <select value={form.sex} onChange={(e) => set('sex', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="M">M</option><option value="F">F</option>
              </select>
            </div>
             <div className="space-y-1.5">
               <Label>{t.admin.function}</Label>
               <Input value={form.role} onChange={(e) => set('role', e.target.value)} />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
                <Label>Ordre d&apos;affichage</Label>
               <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
             </div>
             <div className="space-y-1.5">
               <Label>Désignation</Label>
               <Input value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="ex: Trésorier" />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <Label>{t.admin.phone}</Label>
               <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
             </div>
             <div className="space-y-1.5">
               <Label>{t.admin.status}</Label>
               <select value={form.status} onChange={(e) => set('status', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                 <option value="active">{t.admin.active}</option>
                 <option value="inactive">{t.admin.inactive}</option>
               </select>
             </div>
           </div>
           <div className="space-y-1.5">
             <Label>{t.admin.email}</Label>
             <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
           </div>
           <div className="space-y-1.5">
             <Label>{t.admin.address}</Label>
              <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
           <div className="space-y-1.5">
             <Label>Description</Label>
             <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
           </div>
         </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}>
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateUserModal({ member, onClose, onSaved }: { member: Member; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [roles, setRoles] = useState<{ id: string; name: string; label: string }[]>([])
  const [roleId, setRoleId] = useState('')
  const [email, setEmail] = useState(member.email || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [tempPwd, setTempPwd] = useState('')

  useEffect(() => {
    fetch('/api/admin/roles/roles')
      .then(r => r.ok ? r.json() : [])
      .then(setRoles)
      .catch(() => {})
  }, [])

  async function submit() {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, email, password: password || undefined, roleId }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        toast('Utilisateur créé ✓', 'success')
        if (d.temporaryPassword) setTempPwd(d.temporaryPassword)
        onSaved()
      } else {
        toast(d.error || 'Erreur', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Créer un utilisateur</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <p className="text-sm text-muted-foreground">Membre : <strong>{member.firstName} {member.lastName}</strong></p>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email du membre" />
          </div>
          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">Sélectionner un rôle</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe temporaire (optionnel)</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="généré si vide" />
          </div>
          {tempPwd && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              Mot de passe temporaire : <code>{tempPwd}</code>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}>
            <Check className="h-4 w-4" /> Créer
          </button>
        </div>
      </div>
    </div>
  )
}
