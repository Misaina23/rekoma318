'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  HeartHandshake,
  Mail,
  GraduationCap,
  Eye,
  ArrowRight,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { StatCard, LineChart, BarChart, DonutChart } from '@/components/admin/charts'
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdmin } from '@/components/admin/AdminContext'

type Stats = {
  visitors: number
  visitorsToday: number
  messages: number
  unread: number
  members: number
  activeMembers: number
  activities: number
  formations: number
  donations: number
  donationsCollected: number
}

export default function AdminDashboard() {
  const { t } = useI18n()
  const { role } = useAdmin()
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  const [donut, setDonut] = useState<{ value: number; color: string; label: string }[]>([])
  const [recent, setRecent] = useState<{ id: string; name: string; subject: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {})
    fetch('/api/visits').then((r) => r.json()).then((d: { days: Record<string, number> }) => {
      const entries = Object.entries(d.days || {}).slice(-14)
      setDays({ labels: entries.map((e) => e[0].slice(5)), data: entries.map((e) => e[1]) })
    }).catch(() => {})
    fetch('/api/admin/donations').then((r) => r.json()).then((d: { donations: any[] }) => {
      const stripe = d.donations.filter((x) => x.method === 'stripe').length
      const mvola = d.donations.filter((x) => x.method === 'mvola').length
      setDonut([
        { value: stripe, color: 'hsl(var(--primary))', label: 'Stripe' },
        { value: mvola, color: 'hsl(var(--accent))', label: 'MVola' },
      ])
    }).catch(() => {})
    fetch('/api/admin/messages').then((r) => r.json()).then((m: any[]) => {
      setRecent(m.slice(0, 5).map((x) => ({ id: x.id, name: x.name, subject: x.subject })))
    }).catch(() => {})
  }, [])

  const topPages = [
    { name: 'Accueil', views: Math.round((stats?.visitors || 0) * 0.34) },
    { name: 'Projet PDIMA', views: Math.round((stats?.visitors || 0) * 0.21) },
    { name: 'Impact', views: Math.round((stats?.visitors || 0) * 0.16) },
    { name: 'À propos', views: Math.round((stats?.visitors || 0) * 0.12) },
    { name: 'Contact', views: Math.round((stats?.visitors || 0) * 0.1) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.welcome}</h1>
        <p className="text-sm text-muted-foreground">{t.admin.realtime}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.admin.visitors} value={stats?.visitors ?? '—'} icon={<Eye className="h-4 w-4" />} delta={`+${stats?.visitorsToday ?? 0} ${t.admin.visitorsToday}`} />
        <StatCard label={t.admin.totalCollected} value={`${(stats?.donationsCollected ?? 0).toLocaleString()} Ar`} icon={<HeartHandshake className="h-4 w-4" />} accent="accent" />
        <StatCard label={t.admin.messages} value={stats?.messages ?? '—'} icon={<Mail className="h-4 w-4" />} delta={`${stats?.unread ?? 0} ${t.admin.unread}`} />
        <StatCard label={t.admin.members} value={stats?.activeMembers ?? '—'} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.admin.visitorsChart}</CardTitle>
            </CardHeader>
            <CardContent>
              {days.data.length ? (
                <BarChart data={days.data} labels={days.labels} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </Reveal>
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t.admin.donations}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <DonutChart segments={donut} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{t.admin.nav.messages}</CardTitle>
              <Link href="/admin/messages" className="flex items-center gap-1 text-sm text-primary hover:underline">
                {t.admin.openMessages} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recent.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">{t.admin.noMessages}</p>
              ) : (
                recent.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                    <span className="font-medium">{m.name}</span>
                    <span className="truncate text-muted-foreground">{m.subject || t.contact.message}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t.admin.topPages}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPages.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">{p.views}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${stats ? (p.views / (stats.visitors || 1)) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
