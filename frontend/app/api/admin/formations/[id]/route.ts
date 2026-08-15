import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteFormations } from '@/lib/server/remote'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  const body = await req.json().catch(() => null)
  try {
    return NextResponse.json(await remoteFormations.update(params.id, body, authHeader))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  try {
    await remoteFormations.remove(params.id, authHeader)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com'}/api/cms/formations/${params.id}/certificates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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
    return NextResponse.json({ message: d.error || 'Erreur' }, { status: r.status || 500 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}
