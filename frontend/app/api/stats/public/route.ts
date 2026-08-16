import { NextResponse } from 'next/server'
import { remotePublic } from '@/lib/server/remote'

export async function GET() {
  try {
    const data = await remotePublic.publicStats()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
