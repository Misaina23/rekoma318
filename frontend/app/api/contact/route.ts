import { NextResponse, type NextRequest } from 'next/server'
import { remotePublic } from '@/lib/server/remote'
import { checkRateLimit } from '@/lib/server/rateLimit'
import { readJson, writeJson } from '@/lib/server/store'
import crypto from 'crypto'

function sanitizeText(str: string): string {
  return str.replace(/[<>]/g, '').trim()
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = checkRateLimit(`contact:${ip}`, 10, 3600) // 10 contact messages per hour
  if (!limit.allowed) {
    return NextResponse.json({ message: 'Trop de messages envoyés. Veuillez patienter.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const name = sanitizeText(String(body?.name || '')).slice(0, 100)
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 150)
  const message = sanitizeText(String(body?.message || '')).slice(0, 5000)
  const phone = sanitizeText(String(body?.phone || '')).slice(0, 50)
  const subject = sanitizeText(String(body?.subject || '')).slice(0, 200)

  if (!name || !email || !message) {
    return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Format d\'adresse email invalide' }, { status: 400 })
  }

  const payload = { name, email, phone, subject, message }

  try {
    await remotePublic.postMessage(payload)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.warn('remotePublic.postMessage failed, storing locally:', e.message)
    // Fallback: store message in local messages.json
    const list = await readJson<any[]>('messages.json', [])
    const newMsg = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      read: false,
      archived: false,
      replies: [],
    }
    await writeJson('messages.json', [newMsg, ...list])
    return NextResponse.json({ ok: true })
  }
}
