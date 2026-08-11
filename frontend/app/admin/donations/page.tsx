'use client'

import { useEffect, useState } from 'react'
import { HeartHandshake } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/admin/charts'

type Donation = {
  id: string
  donor: string
  email: string
  phone?: string
  amount: number
  method: 'stripe' | 'mvola'
  status: 'pending' | 'validated' | 'refused'
  createdAt: string
}

const STATUS: Donation['status'][] = ['pending', 'validated', 'refused']

export default function DonationsPage() {
  const { t } = useI18n()
  const [data, setData] = useState<{ donations: Donation[]; totalCollected: number }>({ donations: [], totalCollected: 0 })

  async function load() {
    const r = await fetch('/api/admin/donations')
    if (r.ok) setData(await r.json())
  }
  useEffect(() => { load() }, [])

  async function setStatus(d: Donation, status: Donation['status']) {
    const r = await fetch(`/api/admin/donations/${d.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) })
    if (r.ok) load()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t.admin.nav.donations}</h1>
      <StatCard label={t.admin.totalCollected} value={`${data.totalCollected.toLocaleString()} Ar`} icon={<HeartHandshake className="h-4 w-4" />} accent="accent" />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">{t.admin.donor}</th>
                  <th className="p-4 font-medium">{t.admin.email}</th>
                  <th className="p-4 font-medium">{t.admin.amount}</th>
                  <th className="p-4 font-medium">{t.admin.method}</th>
                  <th className="p-4 font-medium">{t.admin.date}</th>
                  <th className="p-4 font-medium">{t.admin.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.donations.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{d.donor}</td>
                    <td className="p-4 text-muted-foreground">{d.email}</td>
                    <td className="p-4">{d.amount.toLocaleString()} Ar</td>
                    <td className="p-4"><Badge variant="muted">{d.method}</Badge></td>
                    <td className="p-4 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <select value={d.status} onChange={(e) => setStatus(d, e.target.value as Donation['status'])} className="h-9 rounded-lg border border-input bg-background px-2 text-xs">
                        {STATUS.map((s) => <option key={s} value={s}>{(t.admin as any)[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {data.donations.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t.search.empty}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
