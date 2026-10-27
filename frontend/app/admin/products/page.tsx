'use client'

import Image from 'next/image'
import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, ShoppingBag } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  sizes: string[]
  active: boolean
  published: boolean
}

const EMPTY_FORM = { name: '', description: '', price: '', imageUrl: '', sizes: '', active: true, published: true }

export default function AdminProductsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/products')
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible de charger les articles.')
      setProducts(data.items || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(product?: Product) {
    setEditing(product || null)
    setShowForm(true)
    setForm(product ? {
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      sizes: product.sizes.join(', '),
      active: product.active,
      published: product.published,
    } : EMPTY_FORM)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          imageUrl: form.imageUrl.trim() || null,
          sizes: form.sizes.split(',').map((size) => size.trim()).filter(Boolean),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Enregistrement impossible.')
      toast('Article enregistré.', 'success')
      setEditing(null)
      setShowForm(false)
      setForm(EMPTY_FORM)
      await load()
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : 'Erreur d’enregistrement.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function hide(product: Product) {
    if (!window.confirm(`Masquer « ${product.name} » de la boutique ?`)) return
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Impossible de masquer l’article.')
      toast('Article masqué.', 'success')
      await load()
    } catch (hideError) {
      toast(hideError instanceof Error ? hideError.message : 'Erreur.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.nav.products}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez le catalogue visible dans la boutique publique.</p>
        </div>
        <button type="button" onClick={() => startEdit()} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> Nouvel article
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <h2 className="text-lg font-semibold md:col-span-2">{editing ? 'Modifier un article' : 'Ajouter un article'}</h2>
              <div className="space-y-1.5">
                <Label htmlFor="product-name">Nom</Label>
                <Input id="product-name" required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Prix (Ar)</Label>
                <Input id="product-price" type="number" min="0" step="1" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="product-image">Chemin de la photo publique</Label>
                <Input id="product-image" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="/ARTICLE/POLO.jpg" />
                <p className="text-xs text-muted-foreground">Utilisez un chemin comme /ARTICLE/POLO.jpg. Laissez vide si aucune photo n’est disponible.</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea id="product-description" maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="product-sizes">Tailles proposées (séparées par des virgules)</Label>
                <Input id="product-sizes" value={form.sizes} onChange={(event) => setForm({ ...form, sizes: event.target.value })} placeholder="S, M, L, XL" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />
                Visible dans la boutique
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                Disponible à la commande
              </label>
              <div className="flex gap-2 md:col-span-2">
                <button disabled={saving} className={cn(buttonVariants({ size: 'sm' }))}>{saving ? 'Enregistrement…' : t.admin.save}</button>
                <button type="button" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM) }} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>{t.admin.cancel}</button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Chargement…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr><th className="p-4">Article</th><th className="p-4">Prix</th><th className="p-4">Publication</th><th className="p-4">Disponibilité</th><th className="p-4" /></tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden bg-secondary">
                            {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : <ShoppingBag className="m-4 h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sizes.join(', ') || 'Tailles à confirmer'}</p></div>
                        </div>
                      </td>
                      <td className="p-4">{product.price.toLocaleString('fr-FR')} Ar</td>
                      <td className="p-4">{product.published ? 'Publié' : 'Masqué'}</td>
                      <td className="p-4">{product.active ? 'Disponible' : 'Indisponible'}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(product)} aria-label={`Modifier ${product.name}`} className="rounded-md border p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                          {(product.active || product.published) && <button type="button" onClick={() => hide(product)} className="rounded-md border px-3 py-2 text-xs hover:bg-secondary">Masquer</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun article.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
