import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

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
      const filename =
        r.headers.get('content-disposition')?.split('filename=')?.[1]?.replace(/"/g, '') ||
        `attestations-${params.id}.pdf`
      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename=${filename}`,
        },
      })
    }

    const d = await r.json().catch(() => ({}))
    return NextResponse.json(
      { error: d.error || d.message || 'Erreur lors de la génération des attestations' },
      { status: r.status || 500 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
