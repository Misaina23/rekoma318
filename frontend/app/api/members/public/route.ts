import { NextResponse } from 'next/server'
import { remoteMembers } from '@/lib/server/remote'

export async function GET() {
  try {
    const data = await remoteMembers.public()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
