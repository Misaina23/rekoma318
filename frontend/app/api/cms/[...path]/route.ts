import { NextResponse, type NextRequest } from 'next/server'
import { getBackendAuthHeader } from '@/lib/server/guard'
import { API } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const subpath = (params.path || []).join('/')
  const qs = req.nextUrl.searchParams.toString()
  const authHeader = getBackendAuthHeader(req)

  try {
    const r = await fetch(`${API}/api/cms/${subpath}${qs ? `?${qs}` : ''}`, {
      headers: {
        'content-type': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: 'no-store',
    })
    if (!r.ok) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
    }
    const data = await r.json().catch(() => [])
    // Public pages (/actualites, /documents) expect an array when no pagination params are passed
    if (!req.nextUrl.searchParams.has('page') && data && Array.isArray(data.items)) {
      return NextResponse.json(data.items, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
  }
}
