'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react'
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
}

type BasketLine = { productId: string; quantity: number; size: string }
const MAX_ITEM_QUANTITY = 10
const MAX_ORDER_LINES = 10

type SavedOrder = {
  id: string
  total: number
  whatsappUrl: string
}

export default function ArticlesPage() {
  const { locale, t } = useI18n()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [basket, setBasket] = useState<BasketLine[]>([])
  const [sizes, setSizes] = useState<Record<string, string>>({})
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

  useEffect(() => {
    fetch('/api/store/products')
      .then(async (response) => {
        if (!response.ok) throw new Error('Catalogue indisponible')
        const data = await response.json()
        setProducts(data.items || [])
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const subtotal = useMemo(
    () => basket.reduce((sum, line) => sum + (products.find((p) => p.id === line.productId)?.price || 0) * line.quantity, 0),
    [basket, products]
  )

  function addProduct(product: Product) {
    const size = sizes[product.id] || ''
    setBasket((current) => {
      const existing = current.find((line) => line.productId === product.id && line.size === size)
      if (!existing && current.length >= MAX_ORDER_LINES) return current
      if (existing) {
        return current.map((line) =>
          line === existing
            ? { ...line, quantity: Math.min(MAX_ITEM_QUANTITY, line.quantity + 1) }
            : line
        )
      }
      return [...current, { productId: product.id, quantity: 1, size }]
    })
    setSavedOrder(null)
  }

  function canAddProduct(product: Product) {
    const size = sizes[product.id] || ''
    return basket.some((line) => line.productId === product.id && line.size === size) || basket.length < MAX_ORDER_LINES
  }

  function changeQuantity(line: BasketLine, delta: number) {
    setBasket((current) =>
      current
        .map((item) =>
          item === line
            ? { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
    setSavedOrder(null)
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!basket.length) {
      toast(t.store.empty, 'error')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: basket.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            size: line.size,
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible d’enregistrer la demande.')

      const order = data.order
      const orderLines = (order.items as Array<{ name: string; quantity: number; unitPrice: number; size: string | null }>)
        .map((item) => `• ${item.name} × ${item.quantity}${item.size ? ` (${item.size})` : ''} — ${(item.unitPrice * item.quantity).toLocaleString('fr-FR')} Ar`)
        .join('\n')
      const fulfillment = form.deliveryType === 'pickup'
        ? t.store.pickup
        : `${t.store.delivery} — ${form.city}, ${form.address}`
      const message = [
        `Bonjour REKOMA, je souhaite confirmer la commande ${order.id}.`,
        `Nom : ${form.customerName}`,
        `Téléphone : ${form.phone}`,
        `Articles :\n${orderLines}`,
        `Sous-total articles : ${order.total.toLocaleString('fr-FR')} Ar`,
        `Retrait/livraison : ${fulfillment}`,
        'Merci de confirmer les frais de livraison et les modalités de règlement.',
      ].join('\n')
      const whatsappNumber = t.contact.phoneValue.replace(/\D/g, '')
      setSavedOrder({
        id: order.id,
        total: order.total,
        whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      })
      setBasket([])
      toast(t.store.orderSaved, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <section className="border-b border-border bg-background">
        <div className="container py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">REKOMA · Midongy Atsimo</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">{t.store.title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{t.store.intro}</p>
          <p className="mt-4 text-sm text-muted-foreground">{t.store.deliveryNote}</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {loading && <p className="py-10 text-center text-muted-foreground">{t.store.loading}</p>}
          {loadError && (
            <div role="alert" className="py-10 text-center">
              <p className="text-destructive">{t.store.unavailable}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-3 text-sm font-medium underline underline-offset-4">
                {locale === 'fr' ? 'Réessayer' : 'Try again'}
              </button>
            </div>
          )}
          {!loading && !loadError && products.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">{locale === 'fr' ? 'Aucun article disponible pour le moment.' : 'No products are available right now.'}</p>
          )}
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id}>
                <div className="relative aspect-[4/4.5] overflow-hidden bg-secondary/60">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 font-semibold">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.store.noImage}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4 pt-4">
                  <div>
                    <h2 className="font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{product.description}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{product.price.toLocaleString('fr-FR')} Ar</p>
                </div>
                {product.sizes.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <Label htmlFor={`size-${product.id}`}>{t.store.size}</Label>
                    <select
                      id={`size-${product.id}`}
                      value={sizes[product.id] || ''}
                      onChange={(event) => setSizes((current) => ({ ...current, [product.id]: event.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">{locale === 'fr' ? 'Choisir une taille' : 'Choose a size'}</option>
                      {product.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </div>
                )}
                {product.sizes.length === 0 && (
                  <div className="mt-4 space-y-1.5">
                    <Label htmlFor={`size-${product.id}`}>{t.store.size}</Label>
                    <Input
                      id={`size-${product.id}`}
                      value={sizes[product.id] || ''}
                      onChange={(event) => setSizes((current) => ({ ...current, [product.id]: event.target.value }))}
                      placeholder={locale === 'fr' ? 'Ex. M (à confirmer)' : 'e.g. M (to confirm)'}
                      maxLength={20}
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={(product.sizes.length > 0 && !sizes[product.id]) || !canAddProduct(product)}
                  onClick={() => addProduct(product)}
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 w-full rounded-md')}
                >
                  {canAddProduct(product) ? t.store.order : (locale === 'fr' ? 'Limite de 10 lignes par commande' : '10-line order limit reached')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="commande" className="section-pad border-t border-border bg-secondary/30">
        <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">REKOMA</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t.store.basket}</h2>
            <div className="mt-6 space-y-4">
              {basket.length === 0 && <p className="text-sm text-muted-foreground">{t.store.empty}</p>}
              {basket.map((line, index) => {
                const product = products.find((item) => item.id === line.productId)
                if (!product) return null
                return (
                  <div key={`${line.productId}-${line.size}-${index}`} className="flex items-start justify-between gap-4 border-t border-border pt-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {line.size && <p className="text-xs text-muted-foreground">{t.store.size}: {line.size}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{(product.price * line.quantity).toLocaleString('fr-FR')} Ar</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={`${t.store.quantity} -`} onClick={() => changeQuantity(line, -1)} className="rounded border border-border p-1.5"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-5 text-center text-sm">{line.quantity}</span>
                      <button type="button" aria-label={`${t.store.quantity} +`} disabled={line.quantity >= MAX_ITEM_QUANTITY} onClick={() => changeQuantity(line, 1)} className="rounded border border-border p-1.5 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                )
              })}
              {basket.length > 0 && (
                <div className="flex justify-between border-t border-border pt-4 font-semibold">
                  <span>{locale === 'fr' ? 'Sous-total articles' : 'Items subtotal'}</span>
                  <span>{subtotal.toLocaleString('fr-FR')} Ar</span>
                </div>
              )}
            </div>
          </div>

          <div>
            {savedOrder ? (
              <div className="border-y border-border py-8">
                <h3 className="text-xl font-semibold">{t.store.successTitle}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{t.store.orderSaved} · {savedOrder.id}</p>
                <p className="mt-2 text-sm font-medium">{savedOrder.total.toLocaleString('fr-FR')} Ar · {t.store.deliveryNote}</p>
                <Link
                  href={savedOrder.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: 'default' }), 'mt-6 rounded-md')}
                >
                  {t.store.whatsapp}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={submitOrder} className="space-y-5 border-y border-border py-8">
                <h3 className="text-xl font-semibold">{t.store.customer}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-name">{t.store.name}</Label>
                    <Input id="customer-name" autoComplete="name" required maxLength={120} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customer-phone">{t.store.phone}</Label>
                    <Input id="customer-phone" type="tel" autoComplete="tel" required maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer-city">{t.store.city}</Label>
                  <Input id="customer-city" autoComplete="address-level2" required maxLength={120} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{t.store.fulfillment}</legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="deliveryType" value="pickup" checked={form.deliveryType === 'pickup'} onChange={() => setForm({ ...form, deliveryType: 'pickup' })} />
                    {t.store.pickup}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="deliveryType" value="delivery" checked={form.deliveryType === 'delivery'} onChange={() => setForm({ ...form, deliveryType: 'delivery' })} />
                    {t.store.delivery}
                  </label>
                </fieldset>
                {form.deliveryType === 'delivery' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-address">{t.store.address}</Label>
                    <Input id="delivery-address" autoComplete="street-address" required maxLength={500} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="order-note">{t.store.note}</Label>
                  <Textarea id="order-note" maxLength={1000} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{t.store.deliveryNote}</p>
                <button type="submit" disabled={submitting || basket.length === 0} className={cn(buttonVariants({ variant: 'default' }), 'w-full rounded-md')}>
                  {submitting ? (locale === 'fr' ? 'Enregistrement…' : 'Saving…') : t.store.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
