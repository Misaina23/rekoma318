'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ProductCategory = 'Vêtements' | 'Accessoires' | 'Traditionnel' | 'Collector' | 'Articles'

type Product = {
  id: string
  slug?: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  sizes: string[]
  category?: ProductCategory
  active: boolean
  published: boolean
}

type StatusFilter = 'all' | 'live' | 'hidden' | 'unavailable'

const PAGE_SIZE = 5

const CATEGORIES: ProductCategory[] = ['Vêtements', 'Accessoires', 'Traditionnel', 'Collector']
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const GALLERY_PHOTOS = [
  { label: 'Blouson Teddy 2', url: '/ARTICLE/BLOUSON TEDDY 2.jpg' },
  { label: 'Blouson Teddy 1', url: '/ARTICLE/BLOUSOU TEDDY 1.jpg' },
  { label: 'Sweat à capuche', url: '/ARTICLE/SWEAT A CAPUCHE.jpg' },
  { label: 'Sweat', url: '/ARTICLE/SWEAT.jpg' },
  { label: 'Doudoune', url: '/ARTICLE/DOUDONE SANS MANCHE.jpg' },
  { label: 'Polo', url: '/ARTICLE/POLO.jpg' },
  { label: 'T-shirt classique', url: '/ARTICLE/TEE SHIRT.jpg' },
  { label: 'T-shirt oversize', url: '/ARTICLE/TEE SHRT 2.jpg' },
  { label: 'Débardeur', url: '/ARTICLE/DEBARDEUR.jpg' },
  { label: 'Salova', url: '/ARTICLE/tenu tradutionnel malagasy, SALOVA.jpg' },
  { label: 'Casquette', url: '/ARTICLE/CASQUETTE.jpg' },
  { label: 'Peluche', url: '/ARTICLE/PELLUCHE.jpg' },
]

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  sizes: '',
  category: 'Vêtements' as ProductCategory,
  active: true,
  published: true,
}

function isValidImageSrc(src?: string | null): src is string {
  if (!src) return false
  const s = src.trim()
  return s.startsWith('/') || /^https?:\/\/[^/\s]+/.test(s)
}

export default function AdminProductsPage() {
  const { t } = useI18n()
  const toast = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Search, filter & pagination (5 items per page)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Quick inline price edit
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null)
  const [quickPriceValue, setQuickPriceValue] = useState('')

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
      const response = await fetch('/api/admin/products', {
        headers: buildAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible de charger les articles.')
      setProducts(Array.isArray(data.items) ? data.items : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      if (statusFilter === 'live' && !(p.published && p.active)) return false
      if (statusFilter === 'hidden' && p.published) return false
      if (statusFilter === 'unavailable' && p.active) return false

      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        p.sizes.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [products, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, currentPage])

  const stats = useMemo(() => {
    const total = products.length
    const live = products.filter((p) => p.published && p.active).length
    const hiddenOrOff = total - live
    const avgPrice =
      total > 0 ? Math.round(products.reduce((acc, p) => acc + (p.price || 0), 0) / total) : 0
    return { total, live, hiddenOrOff, avgPrice }
  }, [products])

  function startEdit(product?: Product) {
    setEditing(product || null)
    setShowGalleryPicker(false)
    setForm(
      product
        ? {
            name: product.name,
            description: product.description || '',
            price: String(product.price),
            imageUrl: product.imageUrl || '',
            sizes: product.sizes.join(', '),
            category: product.category || 'Vêtements',
            active: product.active,
            published: product.published,
          }
        : EMPTY_FORM
    )
    setShowForm(true)
  }

  function closeModal() {
    if (saving) return
    setShowForm(false)
    setEditing(null)
    setShowGalleryPicker(false)
    setForm(EMPTY_FORM)
  }

  function parsedFormSizes(): string[] {
    return form.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function toggleFormSize(size: string) {
    const current = parsedFormSizes()
    const exists = current.some((s) => s.toUpperCase() === size.toUpperCase())
    const next = exists
      ? current.filter((s) => s.toUpperCase() !== size.toUpperCase())
      : [...current, size]
    setForm({ ...form, sizes: next.join(', ') })
  }

  function stepFormPrice(delta: number) {
    const cur = Math.max(0, Math.round(Number(String(form.price || '0').replace(/\s+/g, '')) || 0))
    setForm({ ...form, price: String(Math.max(0, cur + delta)) })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanPrice = Math.round(Number(String(form.price).replace(/\s+/g, '').replace(',', '.')))
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) {
      toast('Veuillez saisir un prix valide en Ariary.', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: buildAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: cleanPrice,
          imageUrl: form.imageUrl.trim() || null,
          category: form.category,
          sizes: parsedFormSizes(),
          active: form.active,
          published: form.published,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Enregistrement impossible.')

      toast(editing ? 'Article mis à jour avec succès.' : 'Nouvel article ajouté.', 'success')
      setEditing(null)
      setShowForm(false)
      setShowGalleryPicker(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : 'Erreur d’enregistrement.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function openQuickPrice(product: Product) {
    setQuickPriceId(product.id)
    setQuickPriceValue(String(product.price))
  }

  async function saveQuickPrice(product: Product) {
    const nextPrice = Math.round(Number(String(quickPriceValue).replace(/\s+/g, '').replace(',', '.')))
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast('Prix invalide.', 'error')
      return
    }
    if (nextPrice === product.price) {
      setQuickPriceId(null)
      return
    }

    setBusyId(product.id)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ price: nextPrice }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Modification du prix impossible.')

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, price: nextPrice } : item))
      )
      setQuickPriceId(null)
      toast(`Prix mis à jour : ${nextPrice.toLocaleString('fr-FR')} Ar`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du prix.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleVisibility(product: Product) {
    const nextPublished = !product.published
    const payload = nextPublished
      ? { published: true, active: true }
      : { published: false }

    setBusyId(product.id)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Action impossible.')

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, ...payload } : item))
      )
      toast(
        nextPublished
          ? `« ${product.name} » est maintenant visible dans la boutique.`
          : `« ${product.name} » est masqué de la boutique.`,
        'success'
      )
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleStock(product: Product) {
    const nextActive = !product.active
    setBusyId(product.id)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: buildAuthHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ active: nextActive }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Action impossible.')

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, active: nextActive } : item))
      )
      toast(
        nextActive
          ? `« ${product.name} » marqué disponible à la commande.`
          : `« ${product.name} » marqué indisponible.`,
        'success'
      )
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function removeProduct(product: Product) {
    const confirmed = await confirmDialog(
      `Supprimer définitivement « ${product.name} » du catalogue ?`
    )
    if (!confirmed) return

    setBusyId(product.id)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Suppression impossible.')

      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      toast('Article supprimé.', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const startIndex = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(currentPage * PAGE_SIZE, filteredProducts.length)
  const activeSizesInForm = parsedFormSizes()

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.products}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Modifiez les prix, photos, tailles et la disponibilité en temps réel sur la boutique publique.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startEdit()}
          className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] w-full sm:min-h-[40px] sm:w-auto gap-1.5')}
        >
          <Plus className="h-4 w-4" /> Nouvel article
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Total catalogue</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">En ligne (actifs)</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-primary sm:text-2xl">{stats.live}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Masqués / Rupture</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">{stats.hiddenOrOff}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Prix moyen</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
            {stats.avgPrice.toLocaleString('fr-FR')} Ar
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
          {(
            [
              { id: 'all', label: `Tous (${products.length})` },
              { id: 'live', label: 'En boutique' },
              { id: 'hidden', label: 'Masqués' },
              { id: 'unavailable', label: 'Indisponibles' },
            ] as Array<{ id: StatusFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors',
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un article, taille…"
            className="h-10 pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Mobile Native Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {loading && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Chargement…</CardContent>
          </Card>
        )}
        {!loading && paginatedProducts.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun article ne correspond aux critères.
            </CardContent>
          </Card>
        )}
        {!loading &&
          paginatedProducts.map((product) => {
            const isBusy = busyId === product.id
            const isEditingPrice = quickPriceId === product.id

            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                      {isValidImageSrc(product.imageUrl) ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold leading-snug text-foreground">{product.name}</h3>
                      </div>

                      {/* Quick Inline Price Editor on Mobile */}
                      <div className="mt-1.5">
                        {isEditingPrice ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={quickPriceValue}
                              onChange={(e) => setQuickPriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveQuickPrice(product)
                                if (e.key === 'Escape') setQuickPriceId(null)
                              }}
                              className="h-9 w-28 text-sm font-bold tabular-nums"
                              autoFocus
                            />
                            <span className="text-xs font-medium text-muted-foreground">Ar</span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => saveQuickPrice(product)}
                              aria-label="Valider le nouveau prix"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickPriceId(null)}
                              aria-label="Annuler"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openQuickPrice(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-extrabold tabular-nums text-primary transition-colors hover:bg-primary/15"
                            title="Cliquer pour modifier rapidement le prix"
                          >
                            <span>{product.price.toLocaleString('fr-FR')} Ar</span>
                            <Pencil className="h-3 w-3 opacity-75" />
                          </button>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {product.category || 'Vêtements'} ·{' '}
                        {product.sizes.length > 0 ? `Tailles : ${product.sizes.join(', ')}` : 'Taille unique'}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={product.published ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                          {product.published ? 'Publié' : 'Masqué'}
                        </span>
                        <span aria-hidden="true" className="text-muted-foreground">
                          ·
                        </span>
                        <span className={product.active ? 'text-foreground' : 'text-amber-600 dark:text-amber-400'}>
                          {product.active ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => startEdit(product)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleVisibility(product)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      {product.published ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Masquer
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-primary" /> Publier
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => removeProduct(product)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/5 px-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Desktop Data Table View (>= md) */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Article</th>
                    <th className="p-4">Catégorie & Tailles</th>
                    <th className="p-4">Prix (Ar)</th>
                    <th className="p-4">Statut boutique</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const isBusy = busyId === product.id
                    const isEditingPrice = quickPriceId === product.id

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-secondary/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {isValidImageSrc(product.imageUrl) ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <ShoppingBag className="m-4 h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{product.name}</p>
                              {product.description && (
                                <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-medium text-foreground">{product.category || 'Vêtements'}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {product.sizes.length > 0 ? product.sizes.join(', ') : 'Taille unique'}
                          </p>
                        </td>

                        <td className="p-4">
                          {isEditingPrice ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min="0"
                                step="100"
                                value={quickPriceValue}
                                onChange={(e) => setQuickPriceValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveQuickPrice(product)
                                  if (e.key === 'Escape') setQuickPriceId(null)
                                }}
                                className="h-9 w-28 font-bold tabular-nums"
                                autoFocus
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => saveQuickPrice(product)}
                                title="Enregistrer le prix"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickPriceId(null)}
                                title="Annuler"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-secondary"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openQuickPrice(product)}
                              title="Cliquer pour modifier rapidement le prix"
                              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 font-bold tabular-nums text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <span>{product.price.toLocaleString('fr-FR')} Ar</span>
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary" />
                            </button>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                'font-semibold',
                                product.published ? 'text-primary' : 'text-muted-foreground'
                              )}
                            >
                              {product.published ? 'Publié' : 'Masqué'}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => toggleStock(product)}
                              title="Basculer la disponibilité"
                              className={cn(
                                'inline-flex items-center gap-1 underline-offset-4 hover:underline',
                                product.active
                                  ? 'text-foreground'
                                  : 'font-medium text-amber-600 dark:text-amber-400'
                              )}
                            >
                              {product.active ? (
                                <>
                                  <PackageCheck className="h-3.5 w-3.5 text-primary" /> Disponible
                                </>
                              ) : (
                                <>
                                  <PackageX className="h-3.5 w-3.5" /> Indisponible
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => startEdit(product)}
                              title={`Modifier ${product.name}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Modifier
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => toggleVisibility(product)}
                              title={product.published ? 'Masquer de la boutique' : 'Publier dans la boutique'}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary"
                            >
                              {product.published ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" /> Masquer
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-primary" /> Publier
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => removeProduct(product)}
                              aria-label={`Supprimer ${product.name}`}
                              title="Supprimer définitivement"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/25 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Aucun article trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Bar (5 articles per page) */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground tabular-nums">
            Affichage <strong className="text-foreground">{startIndex}</strong>–
            <strong className="text-foreground">{endIndex}</strong> sur{' '}
            <strong className="text-foreground">{filteredProducts.length}</strong> article
            {filteredProducts.length > 1 ? 's' : ''} (5 par page)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors',
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-secondary'
                  )}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
            >
              <span>Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Native Bottom-Sheet / Modal Editor for Create & Edit */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-safe shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />

            <div className="flex items-center justify-between gap-3 border-b border-border pb-3.5">
              <div>
                <h2 id="product-modal-title" className="text-lg font-bold text-foreground">
                  {editing ? `Modifier « ${editing.name} »` : 'Ajouter un nouvel article'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Les modifications sont appliquées immédiatement sur la boutique publique.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fermer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="product-name">Nom de l’article *</Label>
                  <Input
                    id="product-name"
                    required
                    maxLength={200}
                    placeholder="Ex. Polo officiel REKOMA"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Price + Quick Steppers */}
                <div className="space-y-1.5">
                  <Label htmlFor="product-price">Prix unitaire (Ar) *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="35000"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    className="h-11 font-bold tabular-nums"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[-5000, -1000, 1000, 5000].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => stepFormPrice(delta)}
                        className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-[11px] font-semibold tabular-nums hover:bg-secondary"
                      >
                        {delta > 0 ? `+${delta.toLocaleString('fr-FR')}` : delta.toLocaleString('fr-FR')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="product-category">Catégorie</Label>
                  <select
                    id="product-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Preview & Gallery Picker */}
              <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="product-image">Photo de l’article</Label>
                  <button
                    type="button"
                    onClick={() => setShowGalleryPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {showGalleryPicker ? 'Masquer le catalogue photos' : 'Choisir parmi les photos REKOMA'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                    {isValidImageSrc(form.imageUrl) ? (
                      <Image
                        src={form.imageUrl.trim()}
                        alt="Aperçu"
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="product-image"
                      value={form.imageUrl}
                      onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                      placeholder="/ARTICLE/POLO.jpg ou https://..."
                      className="h-10"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Chemin local (/ARTICLE/...) ou lien HTTPS d’une image.
                    </p>
                  </div>
                </div>

                {showGalleryPicker && (
                  <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-4">
                    {GALLERY_PHOTOS.map((photo) => {
                      const selected = form.imageUrl === photo.url
                      return (
                        <button
                          key={photo.url}
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: photo.url })}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all',
                            selected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border bg-background hover:border-foreground/30'
                          )}
                        >
                          <div className="relative h-12 w-full overflow-hidden rounded-lg bg-secondary/40">
                            <Image src={photo.url} alt={photo.label} fill sizes="80px" className="object-contain p-1" />
                          </div>
                          <span className="w-full truncate text-[10px] font-medium">{photo.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-sizes">Tailles disponibles</Label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sizes: '' })}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Taille unique (aucune taille)
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SIZES.map((sz) => {
                    const isSelected = activeSizesInForm.some((s) => s.toUpperCase() === sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleFormSize(sz)}
                        className={cn(
                          'min-h-[38px] min-w-[44px] rounded-lg border px-3 text-xs font-bold transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-secondary'
                        )}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
                <Input
                  id="product-sizes"
                  value={form.sizes}
                  onChange={(event) => setForm({ ...form, sizes: event.target.value })}
                  placeholder="Ex. S, M, L, XL (laisser vide si taille unique)"
                  className="h-10"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  maxLength={2000}
                  rows={3}
                  placeholder="Détails sur la matière, la coupe, la broderie..."
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>

              {/* Status Switches */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) => setForm({ ...form, published: event.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Visible dans la boutique</span>
                </label>

                <label className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm({ ...form, active: event.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Disponible à la commande</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'min-h-[46px] sm:min-h-[40px] sm:px-5'
                  )}
                >
                  {t.admin.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'min-h-[46px] sm:min-h-[40px] sm:px-6 font-semibold'
                  )}
                >
                  {saving ? 'Enregistrement…' : t.admin.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
