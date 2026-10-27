import { NextResponse } from 'next/server'
import { remoteStore } from '@/lib/server/remote'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await remoteStore.products())
  } catch (error) {
    console.error('Unable to load public store products:', error)
    return NextResponse.json({ message: 'Catalogue indisponible.' }, { status: 502 })
  }
}
