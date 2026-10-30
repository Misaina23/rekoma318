'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Check,
  RefreshCw,
  Trash2,
  Phone,
  MapPin,
  Clock,
  ShoppingBag,
  MessageCircle,
  Search,
  AlertCircle,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'

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

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'À confirmer',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-500 animate-pulse',
        icon: AlertCircle,
      }
    case 'confirmed':
      return {
        label: 'Confirmée',
        className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
        dot: 'bg-blue-500',
        icon: Check,
      }
    case 'ready':
      return {
        label: 'Prête',
        className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
        dot: 'bg-purple-500',
        icon: PackageCheck,
      }
    case 'delivered':
      return {
        label: 'Remise / livrée',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        dot: 'bg-emerald-500',
        icon: Truck,
      }
    case 'cancelled':
      return {
        label: 'Annulée',
        className: 'bg-muted text-muted-foreground border border-border',
        dot: 'bg-muted-foreground',
        icon: XCircle,
      }
    default:
      return {
        label: status,
        className: 'bg-muted text-muted-foreground border border-border',
        dot: 'bg-muted-foreground',
        icon: Clock,
      }
  }
}

export default function AdminOrdersPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    load()
  }, [])

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
      toast(`Statut mis à jour : ${STATUS_LABELS[status] || status}`, 'success')
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
      toast(`Commande #${order.id} supprimée définitivement.`, 'success')
    } catch (err: any) {
      toast(err?.message || 'Erreur lors de la suppression de la commande.', 'error')
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL_STATUSES]: orders.length }
    for (const s of STATUSES) {
      counts[s] = orders.filter((o) => o.status === s).length
    }
    return counts
  }, [orders])

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === ALL_STATUSES || order.status === statusFilter
      if (!matchesStatus) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const nameMatch = order.customerName?.toLowerCase().includes(q)
      const phoneMatch = order.phone?.toLowerCase().includes(q)
      const cityMatch = order.city?.toLowerCase().includes(q)
      const idMatch = order.id?.toLowerCase().includes(q)
      const itemMatch = order.items?.some((it) => it.name?.toLowerCase().includes(q))
      return nameMatch || phoneMatch || cityMatch || idMatch || itemMatch
    })
  }, [orders, statusFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.admin.nav.orders}</h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {orders.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi des ventes de la boutique, confirmation avec les clients et expédition.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start sm:self-auto gap-2')}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter(ALL_STATUSES)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            statusFilter === ALL_STATUSES
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span>Toutes</span>
          <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px] font-bold">
            {statusCounts[ALL_STATUSES] || 0}
          </span>
        </button>

        {STATUSES.map((status) => {
          const count = statusCounts[status] || 0
          const isPending = status === 'pending'
          const isSelected = statusFilter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isSelected
                  ? isPending
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : isPending && count > 0
                  ? 'border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{STATUS_LABELS[status]}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isSelected
                    ? 'bg-background/20'
                    : isPending && count > 0
                    ? 'bg-amber-600 text-white'
                    : 'bg-background/40'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, ville ou article…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des commandes…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const badge = getStatusBadge(order.status)
            const BadgeIcon = badge.icon
            const isPending = order.status === 'pending'
            const waNumber = toWhatsAppPhone(order.phone)

            return (
              <Card
                key={order.id}
                className={cn(
                  'overflow-hidden transition-all duration-200 border shadow-sm',
                  isPending
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/[0.03] to-transparent'
                    : 'border-border/70 hover:border-border'
                )}
              >
                {/* Top header row of the card */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">#{order.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      badge.className
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', badge.dot)} />
                    <BadgeIcon className="h-3 w-3" />
                    <span>{badge.label}</span>
                  </div>
                </div>

                {/* Card Content Grid */}
                <CardContent className="grid gap-6 p-5 lg:grid-cols-[1.1fr_1.3fr_1.1fr]">
                  {/* Col 1: Customer details & Contact */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base font-bold text-foreground">{order.customerName}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <a
                          href={`tel:${order.phone}`}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                          title="Appeler le client"
                        >
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <span>{order.phone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{order.city}</span>
                        <span className="mx-1">·</span>
                        <span>
                          {order.deliveryType === 'pickup'
                            ? 'Retrait sur place (Midongy)'
                            : `Livraison à domicile${order.address ? ` : ${order.address}` : ''}`}
                        </span>
                      </div>
                    </div>

                    {order.note && (
                      <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs text-foreground/90">
                        <span className="font-semibold text-muted-foreground">Note client : </span>
                        <span>{order.note}</span>
                      </div>
                    )}

                    {waNumber.length >= 7 && (
                      <div>
                        <a
                          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                            `Bonjour ${order.customerName}, nous vous contactons concernant votre commande REKOMA #${order.id} d’un montant de ${order.total.toLocaleString(
                              'fr-FR'
                            )} Ar.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Contacter sur WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Col 2: Order items summary */}
                  <div className="space-y-2.5 border-t border-border/50 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Panier ({order.items.reduce((s, it) => s + (it.quantity || 1), 0)} articles)</span>
                    </div>

                    <div className="space-y-1.5 divide-y divide-border/30">
                      {order.items.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="flex items-center justify-between pt-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{item.name}</span>
                            {item.size && (
                              <span className="rounded bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-muted-foreground">
                                {item.size}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} Ar
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-t border-border/70 pt-2.5">
                      <span className="text-xs font-medium text-muted-foreground">Total à régler</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">
                          {order.total.toLocaleString('fr-FR')} Ar
                        </span>
                        <p className="text-[10px] text-muted-foreground">frais de livraison à convenir</p>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Actions & Status Management (CLEAN, SINGLE DELETE BUTTON) */}
                  <div className="flex flex-col justify-between gap-4 border-t border-border/50 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Gestion & Statut
                      </span>

                      {/* If order is pending: show direct "Confirmer" button */}
                      {isPending && (
                        <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                            Commande reçue en attente de validation :
                          </p>
                          <button
                            type="button"
                            onClick={() => changeStatus(order, 'confirmed')}
                            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-98 transition-all"
                          >
                            <Check className="h-4 w-4" />
                            <span>Valider & Confirmer</span>
                          </button>
                        </div>
                      )}

                      {/* Status select + Single Delete Button */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Modifier le statut :
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Statut de la commande ${order.id}`}
                            value={order.status}
                            onChange={(event) => changeStatus(order, event.target.value)}
                            className="h-9 flex-1 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>

                          {/* ONE single delete button */}
                          <button
                            type="button"
                            onClick={() => removeOrder(order)}
                            title="Supprimer définitivement la commande"
                            className="flex h-9 items-center justify-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Client : <span className="font-semibold text-foreground">{order.customerName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {visibleOrders.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/60" />
                <h3 className="mt-3 text-base font-semibold text-foreground">Aucune commande trouvée</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? `Aucun résultat pour la recherche « ${searchQuery} ».`
                    : orders.length === 0
                    ? t.search.empty
                    : `Aucune commande avec le statut « ${STATUS_LABELS[statusFilter] || statusFilter} ».`}
                </p>
                {(searchQuery || statusFilter !== ALL_STATUSES) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter(ALL_STATUSES)
                    }}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
