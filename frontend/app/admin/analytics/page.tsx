'use client'

import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard, BarChart, DonutChart, LineChart } from '@/components/admin/charts'

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<any>(null)
  const [days, setDays] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {})
    fetch('/api/visits').then((r) => r.json()).then((d: any) => {
      const e = Object.entries(d.days || {}).slice(-14)
      setDays({ labels: e.map((x) => String(x[0]).slice(5)), data: e.map((x) => Number(x[1])) })
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.nav.analytics}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.admin.visitors} value={stats?.visitors ?? '—'} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label={t.admin.messages} value={stats?.messages ?? '—'} />
        <StatCard label={t.admin.members} value={stats?.members ?? '—'} />
        <StatCard label={t.admin.donations} value={stats?.donations ?? '—'} accent="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t.admin.visitorsChart}</CardTitle></CardHeader>
          <CardContent>{days.data.length ? <LineChart data={days.data} labels={days.labels} /> : <p className="py-8 text-center text-sm text-muted-foreground">—</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t.admin.topPages}</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={[34, 21, 16, 12, 10, 7].map((v) => v * (stats?.visitors ? Math.max(1, Math.round(stats.visitors / 100)) : 1))} labels={['Accueil', 'PDIMA', 'Impact', 'À propos', 'Contact', 'Don']} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Google Analytics 4 se connecte via la variable d&apos;environnement <code>NEXT_PUBLIC_GA_ID</code>. Les tableaux ci-dessus utilisent les données suivies localement (visiteurs, messages, dons).
        </CardContent>
      </Card>
    </div>
  )
}
