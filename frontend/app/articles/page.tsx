'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Trash2,
  Search,
  Sparkles,
  Truck,
  ShieldCheck,
  Store,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  sizes: string[]
  category?: string
  slug?: string
}

type BasketLine = { productId: string; quantity: number; size: string }
const MAX_ITEM_QUANTITY = 10
const MAX_ORDER_LINES = 10
const ITEMS_PER_PAGE = 5

type SavedOrder = {
  id: string
  total: number
  whatsappUrl: string
}

function isValidImageSrc(src?: string | null): src is string {
  if (!src) return false
  const s = src.trim()
  return s.startsWith('/') || /^https?:\/\/[^/\s]+/.test(s)
}

export default function ArticlesPage() {
  const { locale, t } = useI18n()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [basket, setBasket] = useState<BasketLine[]>([])
  const [sizes, setSizes] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    city: 'Midongy Atsimo',
    deliveryType: 'pickup',
    address: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(null)

  // Load basket from local storage on mount
  useEffect(() => {
    try {
      const savedBasket = localStorage.getItem('rekoma_store_basket')
      if (savedBasket) {
        const parsed = JSON.parse(savedBasket)
        if (Array.isArray(parsed)) setBasket(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist basket changes
  useEffect(() => {
    try {
      localStorage.setItem('rekoma_store_basket', JSON.stringify(basket))
    } catch {
      // ignore
    }
  }, [basket])

  // Fetch products catalogue (always fresh so admin price/visibility updates appear immediately)
  useEffect(() => {
    fetch('/api/store/products', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Catalogue indisponible')
        const data = await response.json()
        const items = data.items || []
        setProducts(items)

        // Initialize default sizes for products with sizes
        setSizes((prev) => {
          const next = { ...prev }
          for (const item of items) {
            if (item.sizes && item.sizes.length > 0 && !next[item.id]) {
              next[item.id] = item.sizes[0]
            }
          }
          return next
        })

        // Reconcile persisted basket with currently available catalogue products
        if (items.length > 0) {
          const validIds = new Set(items.map((it: Product) => it.id))
          setBasket((prev) =>
            prev
              .filter((line) => line && typeof line.productId === 'string' && validIds.has(line.productId))
              .map((line) => {
                const prod = items.find((it: Product) => it.id === line.productId)
                const prodSizes = Array.isArray(prod?.sizes) ? prod.sizes : []
                const resolvedSize =
                  prodSizes.length === 0
                    ? ''
                    : prodSizes.includes(line.size)
                      ? line.size
                      : prodSizes[0]
                return {
                  productId: line.productId,
                  quantity: Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.trunc(Number(line.quantity) || 1))),
                  size: resolvedSize,
                }
              })
          )
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      if (p.category) set.add(p.category)
    }
    return ['all', ...Array.from(set)]
  }, [products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchQuery = !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      return matchCategory && matchQuery
    })
  }, [products, selectedCategory, searchQuery])

  // Reset pagination to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(totalPages, page))
    setCurrentPage(clamped)
    document.getElementById('catalogue-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Subtotal and total item count
  const subtotal = useMemo(
    () => basket.reduce((sum, line) => sum + (products.find((p) => p.id === line.productId)?.price || 0) * line.quantity, 0),
    [basket, products]
  )

  const totalItemCount = useMemo(
    () => basket.reduce((sum, line) => sum + line.quantity, 0),
    [basket]
  )

  // Quantity helpers
  function getProductSizeQuantity(productId: string, size: string): number {
    const line = basket.find((l) => l.productId === productId && l.size === size)
    return line ? line.quantity : 0
  }

  function addProduct(product: Product) {
    const size = sizes[product.id] || (product.sizes.length > 0 ? product.sizes[0] : '')
    const key = `${product.id}-${size}`

    setBasket((current) => {
      const existing = current.find((line) => line.productId === product.id && line.size === size)
      if (!existing && current.length >= MAX_ORDER_LINES) {
        toast('Limite de 10 articles distincts atteinte.', 'error')
        return current
      }
      if (existing) {
        return current.map((line) =>
          line === existing
            ? { ...line, quantity: Math.min(MAX_ITEM_QUANTITY, line.quantity + 1) }
            : line
        )
      }
      return [...current, { productId: product.id, quantity: 1, size }]
    })

    // Feedback confirmation
    setRecentlyAdded((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setRecentlyAdded((prev) => ({ ...prev, [key]: false }))
    }, 1600)

    toast(`✓ « ${product.name} » ajouté au panier`, 'success')
    setSavedOrder(null)
  }

  function changeQuantity(productId: string, size: string, delta: number) {
    setBasket((current) =>
      current
        .map((item) => {
          if (item.productId === productId && item.size === size) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, nextQty) } : null
          }
          return item
        })
        .filter((item): item is BasketLine => item !== null)
    )
    setSavedOrder(null)
  }

  function removeLine(productId: string, size: string) {
    setBasket((current) => current.filter((l) => !(l.productId === productId && l.size === size)))
    setSavedOrder(null)
    toast('Article retiré du panier')
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!basket.length) {
      toast(t.store.empty, 'error')
      return
    }
    setSubmitting(true)
    try {
      const validLines = basket.filter((line) => products.some((p) => p.id === line.productId))
      if (!validLines.length) {
        setBasket([])
        toast('Les articles de votre panier ne sont plus disponibles. Veuillez les sélectionner à nouveau.', 'error')
        setSubmitting(false)
        return
      }

      const response = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: validLines.map((line) => {
            const prod = products.find((p) => p.id === line.productId)
            return {
              productId: line.productId,
              name: prod?.name || line.productId,
              unitPrice: prod?.price || 0,
              quantity: Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.trunc(Number(line.quantity) || 1))),
              size: line.size ? String(line.size).trim() : '',
            }
          }),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'Impossible d’enregistrer la demande.')

      const order = data.order
      const orderLines = (order.items as Array<{ name: string; quantity: number; unitPrice: number; size: string | null }>)
        .map((item) => `• ${item.name} × ${item.quantity}${item.size ? ` (${item.size})` : ''} — ${(item.unitPrice * item.quantity).toLocaleString('fr-FR')} Ar`)
        .join('\n')
      const fulfillment = form.deliveryType === 'pickup'
        ? 'Retrait sur place (Midongy Atsimo)'
        : `Livraison expédiée — ${form.city}, ${form.address}`
      const message = [
        `Bonjour REKOMA, je souhaite valider ma commande #${order.id}.`,
        `Nom : ${form.customerName}`,
        `Téléphone : ${form.phone}`,
        `Articles commandés :\n${orderLines}`,
        `Total articles : ${order.total.toLocaleString('fr-FR')} Ar`,
        `Mode de réception : ${fulfillment}`,
        form.note ? `Note : ${form.note}` : '',
        'Merci de me confirmer les détails et les modalités de paiement.',
      ].filter(Boolean).join('\n')

      const rawPhone = t.contact.phoneValue || '+261345332429'
      const whatsappNumber = rawPhone.replace(/\D/g, '') || '261345332429'

      setSavedOrder({
        id: order.id,
        total: order.total,
        whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      })
      setBasket([])
      toast(t.store.orderSaved, 'success')

      // Scroll smoothly to order confirmation
      setTimeout(() => {
        document.getElementById('confirmation-commande')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50/50 dark:bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#123528]/10 via-background to-background py-14 md:py-20">
        <div className="container relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Store className="h-3.5 w-3.5" />
                <span>Boutique Solidaire REKOMA · Midongy Atsimo 318</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t.store.title}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t.store.intro}
              </p>
            </div>

            {/* Quick Header Cart Status */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:min-w-[240px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Votre panier</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {totalItemCount} {totalItemCount > 1 ? 'articles' : 'article'}
                    </p>
                  </div>
                </div>
                {totalItemCount > 0 && (
                  <a
                    href="#commande"
                    className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Voir
                  </a>
                )}
              </div>
              {totalItemCount > 0 && (
                <div className="mt-2.5 border-t border-border pt-2 text-xs font-semibold text-primary">
                  Sous-total : <span className="tabular-nums">{subtotal.toLocaleString('fr-FR')} Ar</span>
                </div>
              )}
            </div>
          </div>

          {/* Value props strip */}
          <div className="mt-8 grid gap-4 border-t border-border/80 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              <span>Confection et sérigraphie locale artisanale</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              <span>Retrait gratuit à Midongy ou livraison province</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Confirmation directe sécurisée par WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Bar */}
      <section id="catalogue-articles" className="scroll-mt-20 py-10">
        <div className="container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-8">
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl max-w-fit">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all',
                    selectedCategory === cat
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {cat === 'all' ? 'Tous les articles' : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 rounded-xl bg-background"
              />
            </div>
          </div>

          {/* Loading / Error / Empty States */}
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">{t.store.loading}</p>
            </div>
          )}

          {loadError && !loading && (
            <div role="alert" className="mx-auto max-w-md rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 font-medium text-destructive">{t.store.unavailable}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-semibold text-primary underline underline-offset-4"
              >
                Réactualiser le catalogue
              </button>
            </div>
          )}

          {!loading && !loadError && filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-3 text-base font-semibold">Aucun article trouvé</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Essayez d&apos;ajuster vos critères de recherche ou de filtre.
              </p>
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Products Grid (5 per page) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product) => {
              const currentSize = sizes[product.id] || (product.sizes.length > 0 ? product.sizes[0] : '')
              const qtyInCart = getProductSizeQuantity(product.id, currentSize)
              const itemKey = `${product.id}-${currentSize}`
              const isJustAdded = recentlyAdded[itemKey]

              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-border/80"
                >
                  <div>
                    {/* Product Image Stage */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-900/60">
                      {isValidImageSrc(product.imageUrl) ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
                          className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                          <ShoppingBag className="h-10 w-10 opacity-40" />
                          <p className="mt-2 text-xs font-medium">{product.name}</p>
                        </div>
                      )}

                      {/* Stock / Artisanat Badge */}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{product.category || 'REKOMA'}</span>
                      </div>

                      {/* Floating In-Cart Indicator Badge on the card image */}
                      {qtyInCart > 0 && (
                        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md animate-in fade-in zoom-in-95">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Au panier ({qtyInCart})</span>
                        </div>
                      )}
                    </div>

                    {/* Product Metadata */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-base font-bold text-foreground leading-snug">
                          {product.name}
                        </h2>
                        <span className="shrink-0 text-base font-extrabold tabular-nums text-foreground">
                          {product.price.toLocaleString('fr-FR')} Ar
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>

                      {/* Size Selector as Pill Tabs if sizes exist */}
                      {product.sizes.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Taille sélectionnée :</span>
                            <span className="font-bold text-foreground uppercase">{currentSize || 'Standard'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.sizes.map((s) => {
                              const isSelected = currentSize === s
                              const sizeQty = getProductSizeQuantity(product.id, s)
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setSizes((cur) => ({ ...cur, [product.id]: s }))}
                                  className={cn(
                                    'relative px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                      : 'bg-muted/80 text-foreground hover:bg-muted'
                                  )}
                                >
                                  {s}
                                  {sizeQty > 0 && (
                                    <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                                      {sizeQty}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Zone: Intelligent Cart Stepper vs Add Button */}
                  <div className="p-5 pt-0">
                    {qtyInCart === 0 ? (
                      /* Initial "Ajouter au panier" button */
                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full h-11 rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200'
                        )}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Ajouter au panier</span>
                      </button>
                    ) : (
                      /* Morphing In-Cart Quantity Stepper with clear feedback */
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(product.id, currentSize, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-sm hover:bg-muted active:scale-95 transition-all"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-2 px-2 text-center">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white font-bold">
                              ✓
                            </span>
                            <div className="leading-tight">
                              <span className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                                Au panier
                              </span>
                              <span className="block text-xs font-bold tabular-nums text-foreground">
                                Qté : {qtyInCart}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => changeQuantity(product.id, currentSize, 1)}
                            disabled={qtyInCart >= MAX_ITEM_QUANTITY}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-center text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {isJustAdded ? '✓ Quantité mise à jour !' : 'Article déjà ajouté à votre sélection'}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {/* Pagination Controls (5 articles per page) */}
          {!loading && !loadError && filteredProducts.length > 0 && (
            <nav
              aria-label="Pagination du catalogue"
              className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row"
            >
              <p className="text-xs text-muted-foreground tabular-nums">
                Affichage{' '}
                <strong className="text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </strong>
                –
                <strong className="text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                </strong>{' '}
                sur <strong className="text-foreground">{filteredProducts.length}</strong> article
                {filteredProducts.length > 1 ? 's' : ''}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="inline-flex min-h-[42px] items-center gap-1 rounded-xl border border-border bg-background px-3.5 text-xs font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      className={cn(
                        'flex h-[42px] w-[42px] items-center justify-center rounded-xl text-xs font-bold tabular-nums transition-all',
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'border border-border bg-background hover:bg-muted'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="inline-flex min-h-[42px] items-center gap-1 rounded-xl border border-border bg-background px-3.5 text-xs font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  <span>Suivant</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}
        </div>
      </section>

      {/* Floating Bottom Cart Bar (appears when items are in cart) */}
      {basket.length > 0 && (
        <aside aria-label="Aperçu du panier" className="fixed bottom-20 md:bottom-6 left-1/2 z-40 -translate-x-1/2 w-[92%] max-w-lg rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {totalItemCount} article{totalItemCount > 1 ? 's' : ''} sélectionné{totalItemCount > 1 ? 's' : ''}
                </p>
                <p className="text-base font-extrabold tabular-nums text-primary">
                  {subtotal.toLocaleString('fr-FR')} Ar
                </p>
              </div>
            </div>

            <a
              href="#commande"
              className={cn(
                buttonVariants({ size: 'default' }),
                'h-11 rounded-xl px-5 font-semibold shadow-md gap-1.5'
              )}
            >
              <span>Valider le panier</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </aside>
      )}

      {/* Order & Checkout Section */}
      <section id="commande" className="border-t border-border bg-stone-100/70 dark:bg-stone-900/40 py-16 md:py-24">
        <div className="container">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-px w-6 bg-primary" />
              Finalisation de votre commande
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {t.store.basket} & Réservation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez vos articles et transmettez directement votre commande sur WhatsApp pour confirmation des frais et du règlement.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            {/* Left Column: Basket review */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold text-foreground">Détail des articles</h3>
                <span className="text-xs font-medium text-muted-foreground">
                  {totalItemCount} article{totalItemCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-4 divide-y divide-border">
                {basket.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto h-12 w-12 opacity-30" />
                    <p className="mt-3 text-sm font-medium">{t.store.empty}</p>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        window.scrollTo({ top: 400, behavior: 'smooth' })
                      }}
                      className="mt-3 inline-block text-xs font-semibold text-primary underline"
                    >
                      Parcourir les articles ci-dessus &uarr;
                    </a>
                  </div>
                )}

                {basket.map((line, idx) => {
                  const product = products.find((item) => item.id === line.productId)
                  if (!product) return null
                  const lineTotal = product.price * line.quantity

                  return (
                    <div key={`${line.productId}-${line.size}-${idx}`} className="flex items-center gap-4 py-4">
                      {/* Thumbnail */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                        {isValidImageSrc(product.imageUrl) ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-6 w-6 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Information */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {line.size && <span className="font-medium text-foreground">Taille : {line.size}</span>}
                          <span>·</span>
                          <span className="tabular-nums">{product.price.toLocaleString('fr-FR')} Ar / u</span>
                        </div>
                        <p className="mt-1 text-xs font-bold tabular-nums text-primary">
                          Total : {lineTotal.toLocaleString('fr-FR')} Ar
                        </p>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border bg-background p-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, line.size, -1)}
                            className="p-1 hover:text-primary transition-colors"
                            aria-label="Diminuer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, line.size, 1)}
                            disabled={line.quantity >= MAX_ITEM_QUANTITY}
                            className="p-1 hover:text-primary disabled:opacity-40 transition-colors"
                            aria-label="Augmenter"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.productId, line.size)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Supprimer cet article"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {basket.length > 0 && (
                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total articles ({totalItemCount})</span>
                    <span className="tabular-nums">{subtotal.toLocaleString('fr-FR')} Ar</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais de livraison</span>
                    <span className="text-xs">Confirmés sur WhatsApp selon destination</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold text-foreground">
                    <span>Sous-total articles</span>
                    <span className="tabular-nums text-lg text-primary">{subtotal.toLocaleString('fr-FR')} Ar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Form or Confirmation */}
            <div id="confirmation-commande" className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              {savedOrder ? (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Demande enregistrée !</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Numéro de commande : <strong className="text-foreground">{savedOrder.id}</strong>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      Montant articles : {savedOrder.total.toLocaleString('fr-FR')} Ar
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-950 dark:text-emerald-200 text-left">
                    <p className="font-semibold mb-1">Dernière étape : transmission WhatsApp</p>
                    <p className="leading-relaxed">
                      Cliquez sur le bouton ci-dessous pour transmettre automatiquement le récapitulatif de votre commande à l&apos;équipe REKOMA et valider le paiement et le retrait.
                    </p>
                  </div>

                  <Link
                    href={savedOrder.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'w-full h-12 rounded-xl font-bold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg flex items-center justify-center gap-2'
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Confirmer sur WhatsApp</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSavedOrder(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Passer une autre commande
                  </button>
                </div>
              ) : (
                <form onSubmit={submitOrder} className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">{t.store.customer}</h3>

                  <div className="space-y-1.5">
                    <Label htmlFor="customer-name">Nom complet *</Label>
                    <Input
                      id="customer-name"
                      autoComplete="name"
                      required
                      placeholder="Ex. Jean Randrianasolo"
                      maxLength={120}
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customer-phone">Numéro de téléphone (WhatsApp) *</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="Ex. +261 34 00 000 00"
                      maxLength={40}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customer-city">Ville / Commune *</Label>
                    <Input
                      id="customer-city"
                      autoComplete="address-level2"
                      required
                      maxLength={120}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <Label>Mode d&apos;obtention</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, deliveryType: 'pickup' })}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold text-left transition-all',
                          form.deliveryType === 'pickup'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/40'
                        )}
                      >
                        <Store className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-bold">Retrait sur place</p>
                          <p className="text-[10px] opacity-80">Midongy Atsimo (Gratuit)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, deliveryType: 'delivery' })}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold text-left transition-all',
                          form.deliveryType === 'delivery'
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/40'
                        )}
                      >
                        <Truck className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-bold">Livraison</p>
                          <p className="text-[10px] opacity-80">Expédition province</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {form.deliveryType === 'delivery' && (
                    <div className="space-y-1.5 animate-in fade-in">
                      <Label htmlFor="delivery-address">Adresse de livraison détaillée *</Label>
                      <Input
                        id="delivery-address"
                        autoComplete="street-address"
                        required
                        placeholder="Quartier, point de repère, commune..."
                        maxLength={500}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="order-note">Précisions ou instructions particulières</Label>
                    <Textarea
                      id="order-note"
                      placeholder="Remarques (ex: préférence de couleur, horaire de retrait...)"
                      maxLength={1000}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="rounded-xl min-h-[70px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || basket.length === 0}
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'w-full h-12 rounded-xl font-bold mt-2 shadow-md gap-2'
                    )}
                  >
                    {submitting ? (
                      'Enregistrement de la commande…'
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        <span>Enregistrer et continuer sur WhatsApp</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    Les frais de transport et modalités de paiement (Mvola ou espèces) sont validés directement avec notre responsable de permanence.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
