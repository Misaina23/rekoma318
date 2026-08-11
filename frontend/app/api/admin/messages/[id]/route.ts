import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { readJson, writeJson } from '@/lib/server/store'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_messages')
  if (res) return res
  const list = await readJson<any[]>('messages.json', [])
  await writeJson('messages.json', list.filter((m) => m.id !== params.id))
  return NextResponse.json({ ok: true })
}
