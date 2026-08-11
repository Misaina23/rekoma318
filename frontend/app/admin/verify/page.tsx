'use client'

import { useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function VerifyPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (r.ok) toast('Adresse email vérifiée (démo).', 'success')
      else toast(t.admin.invalid, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Vérification de l'email</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Saisissez le code reçu par email.
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </div>
            <button type="submit" disabled={loading} className={cn(buttonVariants({}), 'w-full sm:w-auto')}>Vérifier</button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
