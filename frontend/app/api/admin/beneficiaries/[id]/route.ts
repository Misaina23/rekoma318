import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries } from '@/lib/server/remote'
import { saveBeneficiaryExtension } from '@/lib/server/relational'

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res, authHeader } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

  const clean = {
    ...body,
    name:
      body.name?.trim() ||
      (body.lastName && body.firstName ? `${String(body.lastName).trim()} ${String(body.firstName).trim()}` : undefined),
    category: body.category && body.category !== 'Emploi' ? String(body.category) : undefined,
  }
  delete clean.formationId
  delete clean.attendance
  delete clean.formations

  try {
    const updated = await remoteBeneficiaries.update(params.id, clean, authHeader)
    await saveBeneficiaryExtension(params.id, {
      email: body.email ?? null,
      fokontany: body.fokontany ?? null,
      householdSize:
        body.householdSize !== undefined && body.householdSize !== '' && body.householdSize !== null
          ? Math.max(1, Number(body.householdSize) || 1)
          : null,
      notes: body.notes ?? null,
      category: clean.category,
    })
    return NextResponse.json(updated?.item || updated)
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_beneficiaries')
  if (res) return res
  try {
    await remoteBeneficiaries.remove(params.id, authHeader)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: e.status || 500 })
  }
}
