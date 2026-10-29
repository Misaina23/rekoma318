import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API, remoteFormations } from '@/lib/server/remote'
import { readJson, writeJson } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données invalides.' }, { status: 400 })

  const list = await readJson<any[]>('formations.json', [])
  const existingLocal = list.find((f) => f.id === params.id)

  try {
    const response = await remoteFormations.update(params.id, body, authHeader)
    const updated = response?.item || response
    if (existingLocal) {
      await writeJson('formations.json', list.map((f) => (f.id === params.id ? updated : f)))
    }
    return NextResponse.json(updated)
  } catch (e: any) {
    const status = Number(e?.status) || 500
    if (!existingLocal || status === 401 || status === 403) {
      return NextResponse.json(
        { message: e.message || 'Impossible de modifier la formation.' },
        { status }
      )
    }
    const merged = { ...existingLocal, ...body, id: params.id }
    await writeJson('formations.json', list.map((f) => (f.id === params.id ? merged : f)))
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
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const list = await readJson<any[]>('formations.json', [])
  const existedLocally = list.some((f) => f.id === params.id)

  try {
    await remoteFormations.remove(params.id, authHeader)
    if (existedLocally) {
      await writeJson('formations.json', list.filter((f) => f.id !== params.id))
    }
    return NextResponse.json({ ok: true, id: params.id })
  } catch (e: any) {
    const status = Number(e?.status) || 500
    // If it was a local-store formation (404 or 5xx schema mismatch on backend), remove from local JSON cleanly
    if (existedLocally && (status === 404 || status >= 500)) {
      await writeJson('formations.json', list.filter((f) => f.id !== params.id))
      return NextResponse.json({ ok: true, id: params.id })
    }
    console.error('remoteFormations.remove failed:', e.message)
    return NextResponse.json(
      { message: e.message || 'Échec de la suppression de la formation en base de données.' },
      { status }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res
  try {
    const r = await fetch(`${API}/api/cms/formations/${params.id}/certificates`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({}),
    })
    if (r.ok && r.headers.get('content-type')?.includes('application/pdf')) {
      const buffer = Buffer.from(await r.arrayBuffer())
      const filename = r.headers.get('content-disposition')?.split('filename=')?.[1]?.replace(/"/g, '') || `attestations-${params.id}.pdf`
      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename=${filename}`,
        },
      })
    }
    const d = await r.json().catch(() => ({}))
    return NextResponse.json({ message: d.error || 'Erreur lors de la génération des attestations' }, { status: r.status || 500 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
