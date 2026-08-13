import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteMembers } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const q = req.nextUrl.searchParams.get('q') || undefined
  try {
    return NextResponse.json(await remoteMembers.list(q))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_members')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body?.firstName || !body?.lastName) {
    return NextResponse.json({ message: 'Nom et prénom requis' }, { status: 400 })
  }
  try {
    const item = await remoteMembers.create(body)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
