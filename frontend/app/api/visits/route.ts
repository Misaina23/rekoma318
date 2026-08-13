import { NextResponse, type NextRequest } from 'next/server'
import { remotePublic } from '@/lib/server/remote'

export async function GET() {
  return NextResponse.json({ total: 0, days: {} })
}

export async function POST(req: NextRequest) {
  try {
    await remotePublic.postVisit()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
