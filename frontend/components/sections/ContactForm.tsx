'use client'

import { useState, type FormEvent } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'
import { useToast } from '@/components/ui/toast'
import { Input, Textarea, Label } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Errors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm() {
  const { t } = useI18n()
  const toast = useToast()
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')

  function set(field: keyof typeof values, v: string) {
    setValues((s) => ({ ...s, [field]: v }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): Errors {
    const e: Errors = {}
    if (!values.name.trim()) e.name = t.contact.required
    if (!values.email.trim()) e.email = t.contact.required
    else if (!EMAIL_RE.test(values.email)) e.email = t.contact.invalidEmail
    if (!values.subject.trim()) e.subject = t.contact.required
    if (!values.message.trim()) e.message = t.contact.required
    return e
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast(t.contact.success, 'success')
      setValues({ name: '', email: '', subject: '', message: '' })
    } catch {
      toast(t.contact.error, 'error')
    } finally {
      setStatus('idle')
    }
  }

  const fields: { key: keyof typeof values; label: string; ph: string; type: 'input' | 'textarea' }[] = [
    { key: 'name', label: t.contact.name, ph: t.contact.namePh, type: 'input' },
    { key: 'email', label: t.contact.email, ph: t.contact.emailPh, type: 'input' },
    { key: 'subject', label: t.contact.subject, ph: t.contact.subjectPh, type: 'input' },
    { key: 'message', label: t.contact.message, ph: t.contact.messagePh, type: 'textarea' },
  ]

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={f.key}>{f.label}</Label>
          {f.type === 'textarea' ? (
            <Textarea
              id={f.key}
              value={values[f.key]}
              placeholder={f.ph}
              onChange={(e) => set(f.key, e.target.value)}
            />
          ) : (
            <Input
              id={f.key}
              type={f.key === 'email' ? 'email' : 'text'}
              value={values[f.key]}
              placeholder={f.ph}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}
          {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
        </div>
      ))}
      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
      >
        {status === 'sending' ? t.contact.sending : t.contact.send}
      </button>
    </form>
  )
}
