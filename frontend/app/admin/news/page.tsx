'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { remoteCms } from '@/lib/server/remote'

type News = {
  id: string
  titleFr: string
  excerptFr: string
  tagFr: string
  image?: string
  date?: string
  published: boolean
}

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
    const data = await remoteCms
      .news(
        true,
        q || undefined,
        published === '1' ? true : published === '0' ? false : undefined,
        String(page)
      )
      .catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }
  useEffect(() => {
    load()
  }, [q, published, page])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    try {
      await remoteCms.deleteNews(id)
      toast('Supprimé ✓', 'success')
      load()
    } catch (e: any) {
      toast(e?.message || 'Erreur lors de la suppression', 'error')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t.admin.nav.news}</h1>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px] w-full sm:min-h-[38px] sm:w-auto')}
        >
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>
        <select
          value={published}
          onChange={(e) => {
            setPublished(e.target.value)
            setPage(1)
          }}
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-48"
        >
          <option value="">Tous statuts</option>
          <option value="1">Publié</option>
          <option value="0">Masqué</option>
        </select>
      </div>

      {/* Mobile Native Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Aucune actualité.</CardContent>
          </Card>
        )}
        {items.map((n) => (
          <Card key={n.id} className="overflow-hidden">
            <CardContent className="p-4">
              <h3 className="font-bold text-foreground">{n.titleFr}</h3>
              {n.excerptFr && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.excerptFr}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {n.tagFr && (
                  <>
                    <span className="font-semibold text-primary">{n.tagFr}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                {n.date && (
                  <>
                    <span className="tabular-nums">{new Date(n.date).toLocaleDateString('fr-FR')}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className={n.published ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {n.published ? 'Publié' : 'Masqué'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(n)
                    setShowForm(true)
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Data Table View (>= md) */}
      <Card className="hidden md:block">
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
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="p-4 font-medium">{n.titleFr}</td>
                    <td className="p-4 text-muted-foreground">
                      <span className="line-clamp-1">{n.excerptFr}</span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-primary">{n.tagFr || '—'}</td>
                    <td className="p-4 text-muted-foreground tabular-nums">
                      {n.date ? new Date(n.date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="p-4 text-xs font-medium">{n.published ? 'Publié' : 'Masqué'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(n)
                            setShowForm(true)
                          }}
                          className="rounded-lg p-2 hover:bg-secondary"
                          aria-label={t.admin.edit}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(n.id)}
                          className="rounded-lg p-2 text-destructive hover:bg-secondary"
                          aria-label={t.admin.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Aucune actualité.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
          >
            Précédent
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'min-h-[42px] px-4')}
          >
            Suivant
          </button>
        </div>
      )}

      {showForm && (
        <NewsForm
          news={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function NewsForm({ news, onClose, onSaved }: { news: News | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    titleFr: news?.titleFr || '',
    excerptFr: news?.excerptFr || '',
    tagFr: news?.tagFr || '',
    image: news?.image || '',
    published: news?.published ?? true,
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

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
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl pb-safe sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-semibold">{news ? 'Modifier' : 'Nouvelle actualité'}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
          <label className="flex min-h-[40px] items-center gap-2.5 text-sm">
            <input
              id="pub"
              type="checkbox"
              checked={form.published}
              onChange={(e) => set('published', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Publié</span>
          </label>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-[46px] w-full sm:w-auto')}>
            {t.admin.cancel}
          </button>
          <button onClick={submit} disabled={saving} className={cn(buttonVariants({}), 'min-h-[46px] w-full sm:w-auto')}>
            <Check className="h-4 w-4" /> {t.admin.save}
          </button>
        </div>
      </div>
    </div>
  )
}
