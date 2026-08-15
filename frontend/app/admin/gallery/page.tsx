'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, Image as ImageIcon } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast, confirmDialog } from '@/components/ui/toast'
import { Input, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { remoteCms } from '@/lib/server/remote'

type Photo = { id: string; url: string }
type Event = { id: string; title: string; date?: string; photos: Photo[] }

export default function GalleryAdminPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<Event[]>([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [photoEventId, setPhotoEventId] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')

  async function load() {
    const data = await remoteCms.gallery(q || undefined, String(page)).catch(() => ({ items: [], total: 0, page: 1, pageSize: 4, totalPages: 1 } as any))
    setItems((data as any).items || [])
    setTotalPages((data as any).totalPages || 1)
  }
  useEffect(() => { load() }, [q, page])

  async function remove(id: string) {
    if (!(await confirmDialog(t.admin.confirmDelete))) return
    await remoteCms.deleteGalleryEvent(id)
    toast('Événement supprimé ✓', 'success')
    load()
  }

  async function addPhoto() {
    if (!photoEventId || !photoUrl) return
    await remoteCms.addGalleryPhoto(photoEventId, photoUrl)
    setPhotoUrl('')
    setPhotoEventId(null)
    toast('Photo ajoutée ✓', 'success')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.nav.gallery}</h1>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" /> Nouvel événement
        </button>
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Rechercher un événement..." className="pl-9" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((ev) => (
          <Card key={ev.id} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ev.title}</h3>
                  <p className="text-xs text-muted-foreground">{ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(ev); setShowForm(true) }} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(ev.id)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(ev.photos || []).map((p) => (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {(!ev.photos || ev.photos.length === 0) && <p className="text-xs text-muted-foreground">Aucune photo.</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Input value={photoEventId === ev.id ? photoUrl : ''} onChange={(e) => { setPhotoEventId(ev.id); setPhotoUrl(e.target.value) }} placeholder="URL d&apos;une nouvelle photo..." className="h-9 text-xs" />
                <button onClick={() => addPhoto()} className={cn(buttonVariants({ size: 'icon', variant: 'outline' }))}><Plus className="h-4 w-4" /></button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Aucun événement.</CardContent></Card>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Précédent</button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Suivant</button>
        </div>
      )}

      {showForm && (
        <EventForm event={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}

function EventForm({ event, onClose, onSaved }: { event: Event | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({ title: event?.title || '', date: event?.date ? new Date(event.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit() {
    setSaving(true)
    try {
      if (event) {
        await remoteCms.updateNews(event.id, { titleFr: form.title, date: form.date })
      } else {
        await remoteCms.createGalleryEvent({ title: form.title, date: form.date })
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
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{event ? 'Modifier' : 'Nouvel événement'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
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
