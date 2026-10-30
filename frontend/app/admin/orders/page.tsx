'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, RefreshCw, Trash2 } from 'lucide-react'

type OrderItem = { name: string; quantity: number; unitPrice: number; size: string | null }
type Order = {
  id: string
  customerName: string
  phone: string
  city: string
  deliveryType: 'pickup' | 'delivery'
  address: string | null
  note: string | null
  items: OrderItem[]
  total: number
  status: string
  createdAt: string
}

const STATUSES = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  pending: 'À confirmer',
  confirmed: 'Confirmée',
  ready: 'Prête',
  delivered: 'Remise / livrée',
  cancelled: 'Annulée',
}
const ALL_STATUSES = 'all'

function toWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('261')) return digits
  if (digits.startsWith('0')) return `261${digits.slice(1)}`
  if (digits.length === 9) return `261${digits}`
  return digits
}

export default function AdminOrdersPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)

  const visibleOrders = useMemo(
    () => statusFilter === ALL_STATUSES ? orders : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter]
  )

  function buildAuthHeaders(extra: Record<string, string> = {}) {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('rekoma_access_token') : null
    const valid = raw && raw !== 'undefined' && raw !== 'null' ? raw.trim() : null
    return {
      ...extra,
      ...(valid ? { authorization: `Bearer ${valid}` } : {}),
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/orders', {
        headers: buildAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible de charger les commandes.')
      setOrders(data.orders || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function changeStatus(order: Order, status: string) {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible de modifier la commande.')
      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)))
      toast('Statut de commande mis à jour.', 'success')
    } catch (updateError) {
      toast(updateError instanceof Error ? updateError.message : 'Erreur de mise à jour.', 'error')
    }
  }

  async function removeOrder(order: Order) {
    const ok = await confirmDialog(
      `Voulez-vous vraiment supprimer définitivement la commande de ${order.customerName} (#${order.id}) ? Cette action est irréversible.`,
      'Supprimer la commande'
    )
    if (!ok) return

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Impossible de supprimer la commande.')

      setOrders((current) => current.filter((item) => item.id !== order.id))
      toast(`Commande #${order.id} supprimée avec succès.`, 'success')
    } catch (err: any) {
      toast(err?.message || 'Erreur lors de la suppression de la commande.', 'error')
    }
  }

  async function handleStatusSelect(order: Order, value: string) {
    if (value === '__delete__') {
      await removeOrder(order)
      return
    }
    await changeStatus(order, value)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.nav.orders}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consultez les demandes enregistrées et confirmez les détails avec les clients.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span>Filtrer</span>
          <select
            aria-label="Filtrer les commandes par statut"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value={ALL_STATUSES}>Tous les statuts ({orders.length})</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]} ({orders.filter((order) => order.status === status).length})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Chargement des commandes…</p> : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <Card key={order.id} className={order.status === 'pending' ? 'border-amber-500/40 shadow-sm' : ''}>
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{order.customerName}</h2>
                    <Badge variant={order.status === 'cancelled' ? 'muted' : order.status === 'pending' ? 'default' : 'default'} className={order.status === 'pending' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{order.phone}</p>
                  <p className="text-sm text-muted-foreground">{order.city} · {order.deliveryType === 'pickup' ? 'Retrait à Midongy' : `Livraison${order.address ? ` · ${order.address}` : ''}`}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Commande {order.id} · {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
                  {order.note && <p className="mt-2 text-sm">Note : {order.note}</p>}
                  {toWhatsAppPhone(order.phone).length >= 7 && (
                    <a
                      href={`https://wa.me/${toWhatsAppPhone(order.phone)}?text=${encodeURIComponent(`Bonjour ${order.customerName}, nous vous contactons au sujet de votre commande REKOMA ${order.id} d’un montant de ${order.total.toLocaleString('fr-FR')} Ar.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
                    >
                      Contacter sur WhatsApp
                    </a>
                  )}
                </div>
                <div className="space-y-2 border-t border-border pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  {order.items.map((item, index) => (
                    <p key={`${item.name}-${index}`} className="text-sm">
                      {item.name}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                      <span className="ml-2 text-muted-foreground">{(item.unitPrice * item.quantity).toLocaleString('fr-FR')} Ar</span>
                    </p>
                  ))}
                  <p className="border-t border-border pt-2 font-semibold">{order.total.toLocaleString('fr-FR')} Ar <span className="font-normal text-muted-foreground">· livraison à confirmer</span></p>
                </div>
                <div className="flex flex-col items-stretch justify-center gap-2.5 lg:items-end">
                  {order.status === 'pending' && (
                    <div className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-semibold">Action « À confirmer » :</span>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => changeStatus(order, 'confirmed')}
                          className="flex h-8 items-center gap-1 rounded bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Confirmer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOrder(order)}
                          className="flex h-8 items-center gap-1 rounded border border-destructive/40 bg-destructive/15 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Statut de la commande ${order.id}`}
                      value={order.status}
                      onChange={(event) => handleStatusSelect(order, event.target.value)}
                      className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm lg:w-44 lg:flex-none"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                      <option value="__delete__" className="font-semibold text-destructive">
                        🗑️ Supprimer la commande
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeOrder(order)}
                      title="Supprimer cette commande"
                      className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {visibleOrders.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                {orders.length === 0 ? t.search.empty : 'Aucune commande pour ce statut.'}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
