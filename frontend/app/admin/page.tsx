'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  HeartHandshake,
  Mail,
  GraduationCap,
  Eye,
  ArrowRight,
  Briefcase,
  ShoppingBag,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { StatCard, BarChart, DonutChart } from '@/components/admin/charts'
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getBrowserAuthHeaders(): Record<string, string> {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
  const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : null
  return valid ? { authorization: `Bearer ${valid}` } : {}
}

type DashboardStats = {
  visitors: number
  uniqueVisitors: number
  visitorsToday: number
  adminConnections: number
  beneficiariesTotal: number
  beneficiariesActive: number
  beneficiariesCommunes: number
  beneficiarySectors: Record<string, number>
  formations: number
  activeFormations: number
  completedFormations: number
  totalEnrollments: number
  presentEnrollments: number
  participationRate: number
  personnelTotal: number
  personnelActive: number
  contractsBreakdown: Record<string, number>
  monthlyPayroll: number
  messages: number
  unread: number
  members: number
  activeMembers: number
  activities: number
  donations: number
  donationsCollected: number
  ordersTotal: number
  ordersPending: number
  storeRevenue: number
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [days, setDays] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  const [topPages, setTopPages] = useState<{ path: string; name: string; views: number }[]>([])
  const [recentMessages, setRecentMessages] = useState<
    { id: string; name: string; subject: string; read?: boolean }[]
  >([])
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = useCallback(async () => {
    setRefreshing(true)
    const headers = getBrowserAuthHeaders()
    try {
      const [statsRes, visitsRes, msgsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers, credentials: 'include', cache: 'no-store' }).catch(
          () => null
        ),
        fetch('/api/visits', { cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/messages', { headers, credentials: 'include', cache: 'no-store' }).catch(
          () => null
        ),
      ])

      if (statsRes?.ok) {
        const s = await statsRes.json().catch(() => null)
        if (s) setStats(s)
      }

      if (visitsRes?.ok) {
        const v = await visitsRes.json().catch(() => ({}))
        const entries = Object.entries((v.days || {}) as Record<string, number>).slice(-14)
        setDays({
          labels: entries.map(([d]) => d.slice(5)),
          data: entries.map(([, count]) => Number(count) || 0),
        })
        if (Array.isArray(v.topPages)) {
          setTopPages(v.topPages)
        }
      }

      if (msgsRes?.ok) {
        const m = await msgsRes.json().catch(() => [])
        if (Array.isArray(m)) {
          setRecentMessages(
            m.slice(0, 5).map((x: any) => ({
              id: x.id,
              name: x.name,
              subject: x.subject,
              read: x.read,
            }))
          )
        }
      }
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const contractSegments = [
    {
      label: 'CDI',
      value: stats?.contractsBreakdown?.CDI || 0,
      color: 'hsl(var(--primary))',
    },
    {
      label: 'CDD',
      value: stats?.contractsBreakdown?.CDD || 0,
      color: 'hsl(var(--accent))',
    },
    {
      label: 'Stage & Consultant',
      value:
        (stats?.contractsBreakdown?.Stage || 0) +
        (stats?.contractsBreakdown?.Consultant || 0) +
        (stats?.contractsBreakdown?.Prestation || 0),
      color: 'hsl(210 55% 48%)',
    },
  ]

  const sectorEntries = Object.entries(stats?.beneficiarySectors || {}).sort(
    (a, b) => b[1] - a[1]
  )
  const maxSector = Math.max(...sectorEntries.map(([, v]) => v), 1)
  const maxPageViews = Math.max(...topPages.map((p) => p.views), 1)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t.admin.welcome}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Indicateurs dynamiques en temps réel — Visiteurs, Bénéficiaires, Formations, Personnel et Finances.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          disabled={refreshing}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'min-h-[42px] w-full sm:min-h-[38px] sm:w-auto'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Actualiser les indicateurs
        </button>
      </div>

      {/* Primary Relational KPIs */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Visites & Connexions"
          value={stats ? stats.visitors.toLocaleString('fr-FR') : '—'}
          icon={<Eye className="h-4 w-4" />}
          delta={
            stats
              ? `+${stats.visitorsToday} aujourd’hui · ${stats.adminConnections} connexion(s) admin`
              : 'Chargement...'
          }
        />
        <StatCard
          label="Bénéficiaires suivis"
          value={stats ? stats.beneficiariesTotal.toLocaleString('fr-FR') : '—'}
          icon={<Users className="h-4 w-4" />}
          delta={
            stats
              ? `${stats.beneficiariesActive} actifs · ${stats.beneficiariesCommunes} commune(s)`
              : 'Chargement...'
          }
        />
        <StatCard
          label="Formations & Participation"
          value={stats ? `${stats.participationRate}%` : '—'}
          icon={<GraduationCap className="h-4 w-4" />}
          accent="accent"
          delta={
            stats
              ? `${stats.activeFormations} active(s) / ${stats.formations} · ${stats.totalEnrollments} inscrit(s)`
              : 'Chargement...'
          }
        />
        <StatCard
          label="Personnel & RH"
          value={stats ? `${stats.personnelActive}/${stats.personnelTotal}` : '—'}
          icon={<Briefcase className="h-4 w-4" />}
          delta={
            stats
              ? `Masse salariale : ${stats.monthlyPayroll.toLocaleString('fr-FR')} Ar/mois`
              : 'Chargement...'
          }
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label={t.admin.totalCollected}
          value={stats ? `${stats.donationsCollected.toLocaleString('fr-FR')} Ar` : '—'}
          icon={<HeartHandshake className="h-4 w-4" />}
          delta={stats ? `${stats.donations} don(s) enregistré(s)` : undefined}
        />
        <StatCard
          label="Boutique solidaire"
          value={stats ? `${stats.storeRevenue.toLocaleString('fr-FR')} Ar` : '—'}
          icon={<ShoppingBag className="h-4 w-4" />}
          delta={
            stats
              ? `${stats.ordersTotal} commande(s) · ${stats.ordersPending} en attente`
              : undefined
          }
        />
        <StatCard
          label="Activités & Gouvernance"
          value={stats ? stats.activities : '—'}
          icon={<CalendarCheck className="h-4 w-4" />}
          accent="muted"
          delta={stats ? `${stats.activeMembers} membre(s) de gouvernance` : undefined}
        />
        <StatCard
          label={t.admin.messages}
          value={stats ? stats.messages : '—'}
          icon={<Mail className="h-4 w-4" />}
          accent="muted"
          delta={stats ? `${stats.unread} ${t.admin.unread}` : undefined}
        />
      </div>

      {/* Charts Row 1: Dynamic Visitors 14-day Trend + Personnel Contracts Donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Fréquentation dynamique (14 derniers jours)</CardTitle>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {stats?.uniqueVisitors ?? 0} visiteur(s) unique(s) · +{stats?.visitorsToday ?? 0} vue(s) aujourd’hui
                </p>
              </div>
              <span className="text-xs font-medium text-primary tabular-nums">
                {stats?.adminConnections ?? 0} session(s) admin
              </span>
            </CardHeader>
            <CardContent>
              {days.data.length > 0 ? (
                <BarChart data={days.data} labels={days.labels} />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Aucune visite enregistrée sur la période.
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Contrats du Personnel</CardTitle>
                <p className="text-xs text-muted-foreground">Répartition RH par type</p>
              </div>
              <Link
                href="/admin/personnel"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Gérer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <DonutChart segments={contractSegments} />
              <div className="border-t border-border pt-3 text-xs text-muted-foreground tabular-nums">
                Masse salariale active :{' '}
                <strong className="text-foreground">
                  {(stats?.monthlyPayroll ?? 0).toLocaleString('fr-FR')} Ar
                </strong>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* Charts Row 2: Beneficiaries by Agricultural Sector + Formations Participation Summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Bénéficiaires par filière</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Rattachement agricole et communautaire
                </p>
              </div>
              <Link
                href="/admin/beneficiaries"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {sectorEntries.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun bénéficiaire enregistré.
                </p>
              ) : (
                sectorEntries.map(([sector, count]) => (
                  <div key={sector} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-foreground">{sector}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(6, Math.round((count / maxSector) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Suivi relationnel des Formations</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Synthèse issue de la table d’inscriptions
                </p>
              </div>
              <Link
                href="/admin/formations"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Inscriptions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-border bg-secondary/25 p-3">
                  <p className="text-lg font-bold text-foreground tabular-nums sm:text-xl">
                    {stats?.formations ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Sessions totales</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/25 p-3">
                  <p className="text-lg font-bold text-foreground tabular-nums sm:text-xl">
                    {stats?.totalEnrollments ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Inscriptions</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/25 p-3">
                  <p className="text-lg font-bold text-primary tabular-nums sm:text-xl">
                    {stats?.presentEnrollments ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Présences validées</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Taux global d’assiduité</span>
                  <span className="font-bold text-primary tabular-nums">
                    {stats?.participationRate ?? 0}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${stats?.participationRate ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {stats?.activeFormations ?? 0} formation(s) en cours ou planifiée(s) ·{' '}
                  {stats?.completedFormations ?? 0} clôturée(s)
                </p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* Row 3: Recent Messages + Real Top Pages */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{t.admin.nav.messages}</CardTitle>
              <Link
                href="/admin/messages"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
              >
                {t.admin.openMessages} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentMessages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t.admin.noMessages}</p>
              ) : (
                recentMessages.map((m) => (
                  <Link
                    key={m.id}
                    href="/admin/messages"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary/40"
                  >
                    <span className={cn('truncate', !m.read ? 'font-bold text-foreground' : 'font-medium')}>
                      {m.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground sm:text-sm">
                      {m.subject || t.contact.message}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t.admin.topPages}</CardTitle>
              <p className="text-xs text-muted-foreground">Pages publiques les plus visitées</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPages.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Les pages consultées par les visiteurs apparaîtront automatiquement ici.
                </p>
              ) : (
                topPages.map((p) => (
                  <div key={p.path} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="truncate font-medium text-foreground">{p.name}</span>
                      <span className="text-muted-foreground tabular-nums">{p.views}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(8, Math.round((p.views / maxPageViews) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
