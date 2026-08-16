import { NextResponse, type NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'visits.json'), 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ total: 0, days: {} })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { remotePublic } = await import('@/lib/server/remote')
    await remotePublic.postVisit()
  } catch {
    // ignore backend failures
  }
  return NextResponse.json({ ok: true })
}
