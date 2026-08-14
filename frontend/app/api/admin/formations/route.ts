import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteFormations } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  try {
    return NextResponse.json(await remoteFormations.list(authHeader))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_formations')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ message: 'Titre requis' }, { status: 400 })
  try {
    const item = await remoteFormations.create(body, authHeader)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
