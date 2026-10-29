import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res, authHeader } = requireAuth(req, 'manage_members')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données invalides.' }, { status: 400 })

  const list = await readJson<any[]>('members.json', [])
  const existingLocal = list.find((m) => m.id === params.id)

  try {
    const response = await remoteMembers.update(params.id, body, authHeader)
    const updatedItem = response?.item || response
    if (existingLocal) {
      await writeJson('members.json', list.map((m) => (m.id === params.id ? updatedItem : m)))
    }
    revalidatePath('/gouvernance')
    revalidatePath('/api/members/public')
    return NextResponse.json(updatedItem)
  } catch (e: any) {
    const status = Number(e?.status) || 500
    if (!existingLocal || status === 401 || status === 403) {
      return NextResponse.json(
        { message: e.message || 'Impossible de modifier ce membre.' },
        { status }
      )
    }
    const merged = { ...existingLocal, ...body, id: params.id }
    await writeJson('members.json', list.map((m) => (m.id === params.id ? merged : m)))
    revalidatePath('/gouvernance')
    revalidatePath('/api/members/public')
    return NextResponse.json(merged)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_members')
  if (res) return res

  const list = await readJson<any[]>('members.json', [])
  const existedLocally = list.some((m) => m.id === params.id)

  try {
    await remoteMembers.remove(params.id, authHeader)
    if (existedLocally) {
      await writeJson('members.json', list.filter((m) => m.id !== params.id))
    }
    revalidatePath('/gouvernance')
    revalidatePath('/api/members/public')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const status = Number(e?.status) || 500
    if (existedLocally && status === 404) {
      await writeJson('members.json', list.filter((m) => m.id !== params.id))
      revalidatePath('/gouvernance')
      revalidatePath('/api/members/public')
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json(
      { message: e.message || 'Impossible de supprimer ce membre.' },
      { status }
    )
  }
}
