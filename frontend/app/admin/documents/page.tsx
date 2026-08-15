'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, X, Check, Upload, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label, Textarea } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { remoteCms } from '@/lib/server/remote'

type Document = {
  id: string
  title: string
  description?: string
  fileUrl?: string
  imageUrl?: string
  category?: string
  date?: string
  published: boolean
}

const CATEGORIES = ['Rapport', 'Statut', 'Formation', 'Médical', 'Éducation', 'Agriculture', 'Infrastructure', 'Autre']

export default function DocumentsAdminPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Document[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [published, setPublished] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Document | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const data = await remoteCms.documents(true, q || undefined, cat || undefined, published === '1' ? true : published === '0' ? false : undefined, String(page)).catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }
  useEffect(() => { load() }, [q, cat, published, page])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    await remoteCms.deleteDocument(id)
    toast('Supprimé ✓', 'success')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.documents}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> {t.admin.new}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Rechercher..." className="pl-9" />
        </div>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }} className="h-11 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
                  <th className="p-4 font-medium">Catégorie</th>
                  <th className="p-4 font-medium">Fichier</th>
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{d.title}</td>
                    <td className="p-4 text-muted-foreground"><Badge variant="outline">{d.category || '—'}</Badge></td>
                    <td className="p-4 text-muted-foreground">{d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">PDF</a> : '—'}</td>
                    <td className="p-4 text-muted-foreground">{d.imageUrl ? <ImageIcon className="h-4 w-4" /> : '—'}</td>
                    <td className="p-4">
                      <Badge variant={d.published ? 'default' : 'muted'}>{d.published ? 'Publié' : 'Masqué'}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(d); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary" aria-label={t.admin.edit}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(d.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary" aria-label={t.admin.delete}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun document.</td></tr>}
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
        <DocumentForm document={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function DocumentForm({ document, onClose, onSaved }: { document: Document | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({
    title: document?.title || '',
    description: document?.description || '',
    fileUrl: document?.fileUrl || '',
    imageUrl: document?.imageUrl || '',
    category: document?.category || '',
    published: document?.published ?? true,
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    try {
      const body = { ...form, category: form.category || null }
      if (document) {
        await remoteCms.updateDocument(document.id, body)
      } else {
        await remoteCms.createDocument(body)
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
          <h2 className="font-semibold">{document ? 'Modifier' : 'Nouveau document'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>URL du fichier (PDF)</Label>
            <Input value={form.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>URL de l&apos;image (couverture)</Label>
            <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
