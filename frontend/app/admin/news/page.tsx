'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { remoteCms } from '@/lib/server/remote'

type News = { id: string; titleFr: string; excerptFr: string; tagFr: string; image?: string; date?: string; published: boolean }

export default function NewsAdminPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<News[]>([])
  const [q, setQ] = useState('')
  const [published, setPublished] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<News | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const data = await remoteCms.news(true, q || undefined, published === '1' ? true : published === '0' ? false : undefined, String(page)).catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }
  useEffect(() => { load() }, [q, published, page])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    await remoteCms.deleteNews(id)
    toast('Supprimé ✓', 'success')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.news}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Rechercher..." className="pl-9" />
        </div>
        <select value={published} onChange={(e) => { setPublished(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Tous statuts</option>
          <option value="1">Publié</option>
          <option value="0">Masqué</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Titre</th>
                  <th className="p-4 font-medium">Extrait</th>
                  <th className="p-4 font-medium">Tag</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{n.titleFr}</td>
                    <td className="p-4 text-muted-foreground line-clamp-1">{n.excerptFr}</td>
                    <td className="p-4 text-muted-foreground"><Badge variant="outline">{n.tagFr}</Badge></td>
                    <td className="p-4 text-muted-foreground">{n.date ? new Date(n.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="p-4">
                      <Badge variant={n.published ? 'default' : 'muted'}>{n.published ? 'Publié' : 'Masqué'}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(n); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary" aria-label={t.admin.edit}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(n.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary" aria-label={t.admin.delete}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune actualité.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Précédent</button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Suivant</button>
        </div>
      )}

      {showForm && (
        <NewsForm news={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function NewsForm({ news, onClose, onSaved }: { news: News | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({ titleFr: news?.titleFr || '', excerptFr: news?.excerptFr || '', tagFr: news?.tagFr || '', image: news?.image || '', published: news?.published ?? true })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    try {
      const body = { ...form }
      if (news) {
        await remoteCms.updateNews(news.id, body)
      } else {
        await remoteCms.createNews(body)
      }
      toast('Enregistré ✓', 'success')
      onSaved()
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{news ? 'Modifier' : 'Nouvelle actualité'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input value={form.titleFr} onChange={(e) => set('titleFr', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Extrait</Label>
            <Textarea value={form.excerptFr} onChange={(e) => set('excerptFr', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tag</Label>
            <Input value={form.tagFr} onChange={(e) => set('tagFr', e.target.value)} placeholder="Annonce, Événement..." />
          </div>
          <div className="space-y-1.5">
            <Label>URL de l&apos;image</Label>
            <Input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input id="pub" type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
            <Label htmlFor="pub">Publié</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }))}>{t.admin.cancel}</button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}))}>
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}
