'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Check,
  Users,
  RefreshCw,
  UserX,
  Pencil,
  Trash2,
  Plus,
  X,
  UserPlus,
  ShieldAlert,
  Search,
  Lock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Briefcase,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type MemberOption = {
  id: string
  firstName: string
  lastName: string
  email?: string
  role?: string
  designation?: string
  phone?: string
  photo?: string
}

type RoleItem = {
  id: string
  name: string
  label: string
  description?: string
  isSystem?: boolean
  permissionKeys?: string[]
}

type PermissionItem = {
  id: string
  key: string
  label: string
  category?: string
}

type UserItem = {
  id: string
  email: string
  name?: string
  role: string
  roleLabel?: string
  roleId?: string
  active: boolean
  memberId?: string | null
  memberDesignation?: string | null
  lastLoginAt?: string | null
  createdAt?: string | null
  permissions?: string[]
}

export default function SettingsPage() {
  const { t } = useI18n()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security' | 'profile'>('users')
  const [profile, setProfile] = useState<{ email: string; role: string; roleLabel: string } | null>(null)
  const [secret, setSecret] = useState('')
  const [twoFactorActive, setTwoFactorActive] = useState(false)
  const [loading, setLoading] = useState(true)

  // Users, Roles, Permissions and Members shared state
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [perms, setPerms] = useState<PermissionItem[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [showMemberUserModal, setShowMemberUserModal] = useState(false)
  const [showPermsModal, setShowPermsModal] = useState(false)
  const [userForPerms, setUserForPerms] = useState<UserItem | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string; name: string; roleLabel: string } | null>(null)

  // Load basic profile & initial settings
  async function loadProfile() {
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const d = await res.json()
        setProfile(d)
        setTwoFactorActive(Boolean(d.twoFactorEnabled))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Load all RBAC + Users + Members data
  async function loadAllData() {
    setUsersLoading(true)
    try {
      const [usersRes, rolesRes, permsRes, membersRes] = await Promise.all([
        fetch('/api/admin/users', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/admin/roles/roles', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/admin/roles/permissions', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/admin/users?type=members', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      ])
      setUsers(Array.isArray(usersRes) ? usersRes : [])
      setRoles(Array.isArray(rolesRes) ? rolesRes : [])
      setPerms(Array.isArray(permsRes) ? permsRes : [])
      setMembers(Array.isArray(membersRes) ? membersRes : [])
    } catch (e: any) {
      console.warn('Failed to load settings data:', e?.message)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadAllData()
  }, [])

  async function handleToggle2FA() {
    try {
      const r = await fetch('/api/admin/2fa/toggle', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        setTwoFactorActive(Boolean(d.twoFactorEnabled))
        toast(`Authentification à 2 facteurs ${d.twoFactorEnabled ? 'activée' : 'désactivée'} ✓`, 'success')
      } else {
        toast(d.error || 'Erreur lors de la mise à jour 2FA', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur serveur', 'error')
    }
  }

  async function sendTestEmail(url: string, body: any, successMsg: string) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        toast(successMsg, 'success')
        if (d.secret) setSecret(d.secret)
      } else {
        toast(d.error || d.message || 'Erreur', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur serveur', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Chargement des paramètres…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Configuration Système & RBAC
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.admin.nav.settings}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Gérez les accès administrateurs, liez les comptes aux membres REKOMA, et configurez les rôles de connexion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingRole(null)
              setShowRoleModal(true)
            }}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[40px]')}
          >
            <Plus className="mr-1.5 h-4 w-4 text-primary" /> Nouveau Rôle
          </button>
          <button
            onClick={() => setShowMemberUserModal(true)}
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'min-h-[40px] shadow-sm')}
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Attribuer accès à un membre
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Comptes Utilisateurs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{users.length}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({users.filter((u) => u.active).length} actifs)
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rôles Disponibles</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{roles.length}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              (dont Admin & Finance)
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Membres REKOMA</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{members.length}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              éligibles aux accès
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Double Facteur (2FA)</span>
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', twoFactorActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground')}>
              <KeyRound className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={cn('text-sm font-bold', twoFactorActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {twoFactorActive ? 'Activé & Protégé' : 'Désactivé'}
            </span>
            <button
              onClick={handleToggle2FA}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {twoFactorActive ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex border-b border-border">
        <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors',
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            <Users className="h-4 w-4" />
            <span>Utilisateurs & Accès Membres</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              'flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors',
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Rôles & Permissions</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {roles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors',
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            <KeyRound className="h-4 w-4" />
            <span>Sécurité & 2FA</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-colors',
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            <Briefcase className="h-4 w-4" />
            <span>Mon Profil</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: USERS & LINKED MEMBERS */}
      {activeTab === 'users' && (
        <UsersTabContent
          users={users}
          roles={roles}
          members={members}
          loading={usersLoading}
          onRefresh={loadAllData}
          onOpenMemberModal={() => setShowMemberUserModal(true)}
          onOpenPerms={(u) => {
            setUserForPerms(u)
            setShowPermsModal(true)
          }}
        />
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <RolesTabContent
          roles={roles}
          perms={perms}
          loading={usersLoading}
          onRefresh={loadAllData}
          onCreateRole={() => {
            setEditingRole(null)
            setShowRoleModal(true)
          }}
          onEditRole={(r) => {
            setEditingRole(r)
            setShowRoleModal(true)
          }}
        />
      )}

      {/* TAB 3: SECURITY & 2FA */}
      {activeTab === 'security' && (
        <SecurityTabContent
          twoFactorActive={twoFactorActive}
          onToggle2FA={handleToggle2FA}
          profile={profile}
          secret={secret}
          onSendTestEmail={sendTestEmail}
        />
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && profile && (
        <ProfileTabContent profile={profile} />
      )}

      {/* MODAL 1: Role Creation & Editing (Required in Modals) */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          perms={perms}
          onClose={() => setShowRoleModal(false)}
          onSaved={() => {
            setShowRoleModal(false)
            loadAllData()
          }}
        />
      )}

      {/* MODAL 2: Link Member to User Account with Role (Required feature) */}
      {showMemberUserModal && (
        <MemberUserModal
          members={members}
          roles={roles}
          existingUsers={users}
          onClose={() => setShowMemberUserModal(false)}
          onCreated={(creds) => {
            setShowMemberUserModal(false)
            setCreatedCredentials(creds)
            loadAllData()
          }}
        />
      )}

      {/* MODAL 3: Custom User Permissions */}
      {showPermsModal && userForPerms && (
        <UserPermissionsModal
          user={userForPerms}
          perms={perms}
          onClose={() => {
            setShowPermsModal(false)
            setUserForPerms(null)
          }}
          onSaved={() => {
            setShowPermsModal(false)
            setUserForPerms(null)
            loadAllData()
          }}
        />
      )}

      {/* MODAL 4: Display newly created credentials popup */}
      {createdCredentials && (
        <CredentialsAlertModal
          credentials={createdCredentials}
          onClose={() => setCreatedCredentials(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS: USERS TAB CONTENT
// ============================================================================

function UsersTabContent({
  users,
  roles,
  members,
  loading,
  onRefresh,
  onOpenMemberModal,
  onOpenPerms,
}: {
  users: UserItem[]
  roles: RoleItem[]
  members: MemberOption[]
  loading: boolean
  onRefresh: () => void
  onOpenMemberModal: () => void
  onOpenPerms: (u: UserItem) => void
}) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const memberMap = useMemo(() => {
    const map = new Map<string, MemberOption>()
    for (const m of members) map.set(m.id, m)
    return map
  }, [members])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && (u.roleId || u.role) !== roleFilter) return false
      if (!q) return true
      const mem = u.memberId ? memberMap.get(u.memberId) : null
      const full = `${u.email} ${u.name || ''} ${u.roleLabel || u.role} ${mem ? `${mem.firstName} ${mem.lastName} ${mem.designation || ''}` : ''}`.toLowerCase()
      return full.includes(q)
    })
  }, [users, search, roleFilter, memberMap])

  async function toggleActive(u: UserItem) {
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      })
      if (r.ok) {
        toast(`Compte ${!u.active ? 'activé' : 'désactivé'} ✓`, 'success')
        onRefresh()
      } else {
        toast('Erreur lors de la modification', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  async function updateRole(u: UserItem, roleKey: string) {
    const selected = roles.find((r) => r.id === roleKey || r.name === roleKey)
    try {
      const r = await fetch(`/api/admin/roles/users/${u.id}/permissions`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roleId: selected?.id || roleKey, role: selected?.name || roleKey }),
      })
      if (r.ok) {
        toast(`Rôle mis à jour vers ${selected?.label || roleKey} ✓`, 'success')
        onRefresh()
      } else {
        toast('Erreur lors du changement de rôle', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  async function resetPassword(u: UserItem) {
    if (!(await confirmDialog(`Réinitialiser le mot de passe de ${u.email} ?`))) return
    try {
      const r = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.temporaryPassword) {
        toast(`Nouveau mot de passe pour ${u.email} : ${d.temporaryPassword}`, 'success')
      } else {
        toast(d.message || 'Mot de passe réinitialisé', 'success')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur lors de la réinitialisation', 'error')
    }
  }

  async function removeUser(u: UserItem) {
    if (!(await confirmDialog(`Supprimer définitivement l'accès pour ${u.email} ?`))) return
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
      if (r.ok) {
        toast('Utilisateur supprimé ✓', 'success')
        onRefresh()
      } else {
        toast('Erreur lors de la suppression', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email, nom ou membre associé…"
              className="pl-9 text-xs sm:text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm"
          >
            <option value="all">Tous les rôles ({users.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-10')}
            title="Rafraîchir"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={onOpenMemberModal}
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-10 shadow-sm')}
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Lier un Membre
          </button>
        </div>
      </div>

      {/* Users Card Container */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Utilisateurs & Membres autorisés à se connecter
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {filteredUsers.length} utilisateur(s) affiché(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View (< md) */}
          <div className="divide-y divide-border md:hidden">
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aucun utilisateur ne correspond aux critères.
              </div>
            )}
            {filteredUsers.map((u) => {
              const linkedMember = u.memberId ? memberMap.get(u.memberId) : null
              return (
                <div key={u.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {linkedMember && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            👤 Membre REKOMA : {linkedMember.firstName} {linkedMember.lastName}
                            {linkedMember.designation ? ` (${linkedMember.designation})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleActive(u)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-semibold',
                        u.active
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {u.active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Rôle assigné</label>
                    <select
                      value={u.roleId || u.role}
                      onChange={(e) => updateRole(u, e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => onOpenPerms(u)}
                      className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-border bg-secondary/50 px-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Droits
                    </button>
                    <button
                      onClick={() => resetPassword(u)}
                      className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-border bg-secondary/50 px-2 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> MDP
                    </button>
                    <button
                      onClick={() => removeUser(u)}
                      className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-2 text-xs font-semibold text-destructive hover:bg-destructive/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Suppr.
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Utilisateur / Identifiant</th>
                  <th className="p-4">Membre REKOMA Associé</th>
                  <th className="p-4">Rôle Système</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Dernier accès</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u) => {
                  const linkedMember = u.memberId ? memberMap.get(u.memberId) : null
                  const isSuper = u.role === 'super_admin'
                  return (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{u.name || u.email}</div>
                        <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        {linkedMember ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                              {linkedMember.firstName[0]}
                              {linkedMember.lastName[0]}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {linkedMember.firstName} {linkedMember.lastName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {linkedMember.designation || linkedMember.role || 'Gouvernance'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Compte autonome</span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={u.roleId || u.role}
                          onChange={(e) => updateRole(u, e.target.value)}
                          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleActive(u)}
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-85',
                            u.active
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {u.active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground tabular-nums">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenPerms(u)}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                            title="Permissions personnalisées"
                          >
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => resetPassword(u)}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                            title="Réinitialiser le mot de passe"
                          >
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => removeUser(u)}
                              className={cn(
                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                'h-8 w-8 text-destructive hover:bg-destructive/10'
                              )}
                              title="Supprimer l'accès"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS: ROLES TAB CONTENT
// ============================================================================

function RolesTabContent({
  roles,
  perms,
  loading,
  onRefresh,
  onCreateRole,
  onEditRole,
}: {
  roles: RoleItem[]
  perms: PermissionItem[]
  loading: boolean
  onRefresh: () => void
  onCreateRole: () => void
  onEditRole: (r: RoleItem) => void
}) {
  const toast = useToast()

  async function removeRole(r: RoleItem) {
    if (r.isSystem) {
      toast('Les rôles système ne peuvent pas être supprimés.', 'error')
      return
    }
    if (!(await confirmDialog(`Supprimer définitivement le rôle « ${r.label} » ?`))) return
    try {
      const res = await fetch(`/api/admin/roles/roles/${r.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Rôle supprimé ✓', 'success')
        onRefresh()
      } else {
        toast('Erreur lors de la suppression du rôle', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur serveur', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Gestion des Rôles & Accès Granulaires (RBAC)</h2>
          <p className="text-xs text-muted-foreground">
            Configurez les profils d&apos;accès : Administrateur général, Finance, Coordinateur, etc.
          </p>
        </div>
        <button
          onClick={onCreateRole}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-10 shadow-sm')}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nouveau Rôle (Modal)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => {
          const permCount = r.permissionKeys?.length || 0
          const isFinance = r.name.includes('finance')
          const isAdmin = r.name === 'admin' || r.name === 'super_admin'

          return (
            <Card key={r.id} className="flex flex-col justify-between overflow-hidden border border-border shadow-sm">
              <CardHeader className="border-b border-border/60 bg-secondary/15 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{r.label}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{r.name}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      isAdmin
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : isFinance
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {r.isSystem ? 'Système' : 'Personnalisé'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {r.description || 'Aucune description spécifique renseignée.'}
                </p>

                <div className="rounded-xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Permissions accordées</span>
                    <span className="rounded-md bg-background px-1.5 py-0.5 text-[11px] font-bold text-primary">
                      {permCount} / {perms.length}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(r.permissionKeys || []).slice(0, 4).map((key) => (
                      <span
                        key={key}
                        className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {key.replace(/^(manage_|view_)/, '')}
                      </span>
                    ))}
                    {permCount > 4 && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{permCount - 4} autres
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => onEditRole(r)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs font-semibold')}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Modifier dans la Modal
                  </button>
                  {!r.isSystem && (
                    <button
                      onClick={() => removeRole(r)}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'h-8 text-xs font-semibold text-destructive hover:bg-destructive/10'
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS: SECURITY & 2FA TAB CONTENT
// ============================================================================

function SecurityTabContent({
  twoFactorActive,
  onToggle2FA,
  profile,
  secret,
  onSendTestEmail,
}: {
  twoFactorActive: boolean
  onToggle2FA: () => void
  profile: any
  secret: string
  onSendTestEmail: (url: string, body: any, msg: string) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-primary" />
            Authentification à deux facteurs (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            L&apos;authentification à deux facteurs requiert un code de vérification envoyé à l&apos;adresse email de l&apos;administrateur lors de chaque connexion.
          </p>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">
                Statut 2FA :{' '}
                <span className={twoFactorActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                  {twoFactorActive ? 'Activé (Code de sécurité exigé)' : 'Désactivé'}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {twoFactorActive
                  ? 'Tous les administrateurs recevront un code temporaire à 6 chiffres par e-mail.'
                  : 'Connexion directe par email et mot de passe.'}
              </p>
            </div>
            <button
              onClick={onToggle2FA}
              className={cn(
                buttonVariants({ variant: twoFactorActive ? 'outline' : 'default' }),
                'min-h-[42px]'
              )}
            >
              <KeyRound className="mr-1.5 h-4 w-4" />
              {twoFactorActive ? 'Désactiver 2FA' : 'Activer la protection 2FA'}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Tests d&apos;envoi d&apos;e-mails & Vérifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vérifiez le bon fonctionnement des notifications d&apos;authentification et des réinitialisations de mot de passe.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onSendTestEmail('/api/admin/verify', { code: '123456' }, 'Code de validation validé (démo) ✓')}
              className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[42px]')}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Tester code de vérification
            </button>
            <button
              onClick={() => onSendTestEmail('/api/admin/forgot', { email: profile?.email }, `Email de réinitialisation envoyé à ${profile?.email} ✓`)}
              className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[42px]')}
            >
              <Mail className="mr-1.5 h-4 w-4" /> Tester mot de passe oublié
            </button>
          </div>
          {secret && (
            <div className="mt-4 rounded-xl border border-border bg-secondary p-3">
              <p className="text-xs font-semibold text-muted-foreground">Secret TOTP généré :</p>
              <code className="mt-1 block break-all font-mono text-xs">{secret}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS: PROFILE TAB CONTENT
// ============================================================================

function ProfileTabContent({ profile }: { profile: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations sur la session active</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Adresse Email Connectée</p>
            <p className="mt-1 font-semibold text-foreground">{profile.email}</p>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Rôle Administratif</p>
            <p className="mt-1 font-semibold text-primary">{profile.roleLabel || profile.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MODAL 1: ROLE CREATION / EDITING MODAL (REQUIRED: ADD NEW ROLE IN MODAL)
// ============================================================================

function RoleModal({
  role,
  perms,
  onClose,
  onSaved,
}: {
  role: RoleItem | null
  perms: PermissionItem[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(role?.name || '')
  const [label, setLabel] = useState(role?.label || '')
  const [description, setDescription] = useState(role?.description || '')
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(role?.permissionKeys || [])
  )
  const [saving, setSaving] = useState(false)

  // Categorize permissions for clean checkbox display
  const categories = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {}
    for (const p of perms) {
      const cat = p.category || 'Général'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    }
    return groups
  }, [perms])

  function selectAll() {
    setSelectedPerms(new Set(perms.map((p) => p.key)))
  }

  function deselectAll() {
    setSelectedPerms(new Set())
  }

  async function submit() {
    if (!name.trim() || !label.trim()) {
      toast('Le nom technique et le libellé du rôle sont obligatoires.', 'error')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        label: label.trim(),
        description: description.trim(),
        permissionKeys: Array.from(selectedPerms),
      }
      const res = await fetch(
        role ? `/api/admin/roles/roles/${role.id}` : '/api/admin/roles/roles',
        {
          method: role ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast(role ? 'Rôle mis à jour avec succès ✓' : 'Nouveau rôle créé avec succès ✓', 'success')
        onSaved()
      } else {
        toast(data.error || data.message || 'Erreur lors de l’enregistrement du rôle', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur serveur', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {role ? `Modifier le rôle : ${role.label}` : 'Ajouter un nouveau rôle'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Définissez les autorisations et l&apos;intitulé de ce profil RBAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nom technique système</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: finance_lead, coordinateur"
                disabled={Boolean(role?.isSystem)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Sans espaces (ex: finance_assistant)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Libellé d&apos;affichage</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ex: Responsable Financier"
              />
              <p className="text-[11px] text-muted-foreground">Nom affiché sur les badges</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description du rôle</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Suivi financier, validation des dons MVola/Stripe et commandes boutique"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permissions associées ({selectedPerms.size} sélectionnées)
              </Label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-medium text-primary hover:underline"
                >
                  Tout cocher
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="font-medium text-muted-foreground hover:underline"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* Categorized permissions checkboxes */}
            <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
              {Object.entries(categories).map(([catName, permList]) => (
                <div key={catName} className="space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {catName}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {permList.map((p) => {
                      const checked = selectedPerms.has(p.key)
                      return (
                        <label
                          key={p.key}
                          className={cn(
                            'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors',
                            checked
                              ? 'border-primary/40 bg-primary/5 text-foreground'
                              : 'border-border bg-card text-muted-foreground hover:bg-secondary/40'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selectedPerms)
                              if (e.target.checked) next.add(p.key)
                              else next.delete(p.key)
                              setSelectedPerms(next)
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-tight text-foreground">{p.label}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{p.key}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[42px]')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={cn(buttonVariants({ variant: 'default' }), 'min-h-[42px] px-5 shadow-sm')}
          >
            <Check className="mr-1.5 h-4 w-4" />
            {saving ? 'Enregistrement…' : role ? 'Mettre à jour le rôle' : 'Créer le rôle'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL 2: LINK MEMBER TO USER ACCOUNT (REQUIRED: LINK MEMBER TO ROLE/ADMIN/FINANCE)
// ============================================================================

function MemberUserModal({
  members,
  roles,
  existingUsers,
  onClose,
  onCreated,
}: {
  members: MemberOption[]
  roles: RoleItem[]
  existingUsers: UserItem[]
  onClose: () => void
  onCreated: (creds: { email: string; pass: string; name: string; roleLabel: string }) => void
}) {
  const toast = useToast()

  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleKey, setRoleKey] = useState('finance_lead')
  const [saving, setSaving] = useState(false)

  // Track already linked member IDs to show helpful badge
  const linkedMemberIds = useMemo(() => {
    return new Set(existingUsers.map((u) => u.memberId).filter(Boolean))
  }, [existingUsers])

  // Generate a random secure initial password
  useEffect(() => {
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    setPassword(`Rekoma#${randomCode}`)
  }, [])

  // Auto-fill member email & suggest role based on designation
  function handleSelectMember(memberId: string) {
    setSelectedMemberId(memberId)
    const m = members.find((x) => x.id === memberId)
    if (!m) return

    if (m.email) {
      setEmail(m.email)
    } else {
      // Suggest a standard formatted email
      const cleanFirst = m.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const cleanLast = m.lastName.toLowerCase().replace(/[^a-z0-9]/g, '')
      setEmail(`${cleanFirst}.${cleanLast}@rekoma.mg`)
    }

    // Auto-detect role suitability
    const des = `${m.designation || ''} ${m.role || ''}`.toLowerCase()
    if (des.includes('trésor') || des.includes('financ') || des.includes('comptab')) {
      const financeRole = roles.find((r) => r.name.includes('finance'))
      if (financeRole) setRoleKey(financeRole.id)
    } else if (des.includes('président') || des.includes('secrétaire')) {
      const adminRole = roles.find((r) => r.name === 'admin' || r.name === 'super_admin')
      if (adminRole) setRoleKey(adminRole.id)
    } else if (des.includes('coordinat') || des.includes('projet') || des.includes('direct')) {
      const mgrRole = roles.find((r) => r.name === 'manager')
      if (mgrRole) setRoleKey(mgrRole.id)
    }
  }

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  )

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleKey || r.name === roleKey) || null,
    [roles, roleKey]
  )

  async function submit() {
    if (!selectedMemberId) {
      toast('Veuillez sélectionner un membre de REKOMA.', 'error')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Veuillez renseigner une adresse email valide pour la connexion.', 'error')
      return
    }
    if (!password.trim() || password.length < 6) {
      toast('Le mot de passe doit contenir au moins 6 caractères.', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          email: email.trim(),
          password: password.trim(),
          role: selectedRole?.name || 'admin',
          roleId: selectedRole?.id || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast('Accès utilisateur créé avec succès ✓', 'success')
        onCreated({
          email: email.trim(),
          pass: data.temporaryPassword || password.trim(),
          name: `${selectedMember?.firstName} ${selectedMember?.lastName}`,
          roleLabel: selectedRole?.label || 'Administrateur',
        })
      } else {
        toast(data.error || data.message || 'Impossible de créer le compte', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur serveur', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Attribuer un accès à un membre</h2>
              <p className="text-xs text-muted-foreground">
                Liez un membre REKOMA pour lui donner un rôle (Admin, Finance, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          {/* Step 1: Member Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              1. Sélectionner le membre REKOMA <span className="text-destructive">*</span>
            </Label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleSelectMember(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
            >
              <option value="">-- Choisir un membre de la gouvernance --</option>
              {members.map((m) => {
                const hasAccount = linkedMemberIds.has(m.id)
                return (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} {m.designation ? `— ${m.designation}` : ''}
                    {hasAccount ? ' (A déjà un accès)' : ''}
                  </option>
                )
              })}
            </select>
            {selectedMember && (
              <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/30 p-3 mt-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {selectedMember.firstName[0]}
                  {selectedMember.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fonction : <strong className="text-foreground">{selectedMember.designation || selectedMember.role || 'Membre'}</strong>
                    {selectedMember.phone ? ` · ${selectedMember.phone}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Role selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              2. Rôle d&apos;accès à attribuer <span className="text-destructive">*</span>
            </Label>
            <select
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.name})
                </option>
              ))}
            </select>
            {selectedRole && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-primary font-semibold block mb-0.5">
                  Portée du rôle {selectedRole.label} :
                </strong>
                {selectedRole.description || 'Ce rôle donne accès aux modules associés.'}
              </div>
            )}
          </div>

          {/* Step 3: Login Credentials */}
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-xs font-bold text-foreground">3. Identifiants de connexion</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email de connexion</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: prenom.nom@rekoma.mg"
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Sera utilisé pour se connecter à l&apos;espace admin</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mot de passe temporaire</Label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="h-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setPassword(`Rekoma#${Math.floor(1000 + Math.random() * 9000)}`)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-10 px-3')}
                  title="Générer un autre mot de passe"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ce mot de passe permettra la première connexion du membre.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[42px]')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={cn(buttonVariants({ variant: 'default' }), 'min-h-[42px] px-5 shadow-sm')}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            {saving ? 'Création en cours…' : 'Créer l’accès et autoriser la connexion'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL 3: CUSTOM USER PERMISSIONS MODAL
// ============================================================================

function UserPermissionsModal({
  user,
  perms,
  onClose,
  onSaved,
}: {
  user: UserItem
  perms: PermissionItem[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [caps, setCaps] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const map: Record<string, boolean> = {}
    for (const p of perms) map[p.key] = false
    if (Array.isArray(user.permissions)) {
      for (const k of user.permissions) map[k] = true
    }
    setCaps(map)
  }, [user, perms])

  async function submit() {
    setSaving(true)
    const allowed = perms.map((p) => p.key).filter((k) => caps[k])
    try {
      const res = await fetch(`/api/admin/roles/users/${user.id}/permissions`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ permissions: allowed }),
      })
      if (res.ok) {
        toast('Permissions spécifiques enregistrées ✓', 'success')
        onSaved()
      } else {
        toast('Erreur lors de l’enregistrement des permissions', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Permissions personnalisées : {user.name || user.email}
            </h2>
            <p className="text-xs text-muted-foreground">
              Rôle principal : <strong className="text-primary">{user.roleLabel || user.role}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-6">
          <p className="text-xs text-muted-foreground">
            Cochez les modules autorisés pour cet utilisateur spécifique. Ces autorisations complètent ou surchargent les permissions par défaut du rôle.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {perms.map((p) => (
              <label
                key={p.key}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors',
                  caps[p.key]
                    ? 'border-primary/40 bg-primary/5 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary/40'
                )}
              >
                <input
                  type="checkbox"
                  checked={Boolean(caps[p.key])}
                  onChange={(e) => setCaps((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight text-foreground">{p.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{p.key}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[42px]')}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={cn(buttonVariants({ variant: 'default' }), 'min-h-[42px] px-5 shadow-sm')}
          >
            <Check className="mr-1.5 h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer les permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL 4: CREATED CREDENTIALS ALERT MODAL
// ============================================================================

function CredentialsAlertModal({
  credentials,
  onClose,
}: {
  credentials: { email: string; pass: string; name: string; roleLabel: string }
  onClose: () => void
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  function copyCreds() {
    const text = `Identifiants REKOMA pour ${credentials.name} (${credentials.roleLabel}) :\nLien de connexion : /admin/login\nEmail : ${credentials.email}\nMot de passe : ${credentials.pass}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    toast('Identifiants copiés dans le presse-papier ✓', 'success')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">Accès Membre Créé avec Succès</h3>
            <p className="text-xs text-muted-foreground">Transmettez ces identifiants au membre</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-secondary/30 p-3.5 text-xs">
          <div>
            <span className="text-muted-foreground">Membre associé :</span>{' '}
            <strong className="text-foreground">{credentials.name}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Rôle attribué :</span>{' '}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {credentials.roleLabel}
            </span>
          </div>
          <div className="border-t border-border pt-2">
            <span className="text-muted-foreground">Email de connexion :</span>
            <p className="mt-0.5 font-mono font-bold text-foreground">{credentials.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Mot de passe temporaire :</span>
            <p className="mt-0.5 font-mono font-bold text-primary">{credentials.pass}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={copyCreds}
            className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 min-h-[42px]')}
          >
            {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier les accès'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(buttonVariants({ variant: 'default' }), 'flex-1 min-h-[42px]')}
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  )
}
