import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteActivities } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_activities')
  if (res) return res
  const q = req.nextUrl.searchParams.get('q') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const page = req.nextUrl.searchParams.get('page') || undefined
  try {
    return NextResponse.json(await remoteActivities.list(q, status, page, authHeader))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res, authHeader } = requireAuth(req, 'manage_activities')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ message: 'Titre requis' }, { status: 400 })
  try {
    const item = await remoteActivities.create(body, authHeader)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
