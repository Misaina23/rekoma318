import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries } from '@/lib/server/remote'

export async function GET(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  const q = req.nextUrl.searchParams.get('q') || undefined
  const category = req.nextUrl.searchParams.get('category') || undefined
  const formationId = req.nextUrl.searchParams.get('formationId') || undefined
  const status = req.nextUrl.searchParams.get('status') || undefined
  const sex = req.nextUrl.searchParams.get('sex') || undefined
  const commune = req.nextUrl.searchParams.get('commune') || undefined
  const page = req.nextUrl.searchParams.get('page') || undefined
  try {
    return NextResponse.json(await remoteBeneficiaries.list(q, category, formationId, status, sex, commune, page, authHeader))
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function POST(req: NextRequest) {
  const { res } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res
  const token = req.cookies.get('rekoma_access_token')?.value
  const authHeader = token ? `Bearer ${token}` : undefined
  const body = await req.json().catch(() => null)
  if (!body?.firstName || !body?.lastName) {
    return NextResponse.json({ message: 'Nom et prénom requis' }, { status: 400 })
  }
  try {
    const item = await remoteBeneficiaries.create(body, authHeader)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
