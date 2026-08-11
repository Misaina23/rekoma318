import { NextResponse, type NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/server/store'

type Visits = { total: number; days: Record<string, number> }

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const data = await readJson<Visits>('visits.json', { total: 0, days: {} })
  return NextResponse.json(data)
}

export async function POST() {
  const data = await readJson<Visits>('visits.json', { total: 0, days: {} })
  const day = today()
  data.total += 1
  data.days[day] = (data.days[day] || 0) + 1
  await writeJson('visits.json', data)
  return NextResponse.json(data)
}
