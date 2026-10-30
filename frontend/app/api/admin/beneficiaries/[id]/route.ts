import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries } from '@/lib/server/remote'
import {
  saveBeneficiaryExtension,
  markBeneficiaryDeleted,
  getLocalBeneficiaries,
  saveLocalBeneficiary,
  getPivotState,
  savePivotState,
} from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

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

  let updatedRemote: any = null
  try {
    const updated = await remoteBeneficiaries.update(params.id, clean, authHeader)
    updatedRemote = updated?.item || updated
  } catch (e: any) {
    console.warn('remote update failed, saving locally:', e.message)
  }

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

  // Update local beneficiaries cache
  const locals = await getLocalBeneficiaries()
  const found = locals.find((b) => b.id === params.id)
  const merged = {
    ...(found || {}),
    ...(updatedRemote || {}),
    ...clean,
    id: params.id,
  }
  await saveLocalBeneficiary(merged)

  return NextResponse.json(merged)
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

  const beneficiaryId = params.id

  // 1. Mark permanently deleted locally so it never resurfaces in queries
  await markBeneficiaryDeleted(beneficiaryId)

  // 2. Remove any local pivot enrollments for this beneficiary
  try {
    const pivot = await getPivotState()
    const cleanedEnrollments = (pivot.enrollments || []).filter((e) => e.beneficiaryId !== beneficiaryId)
    await savePivotState({
      ...pivot,
      enrollments: cleanedEnrollments,
    })
  } catch {}

  // 3. Delete from remote backend (soft delete or hard delete)
  try {
    await remoteBeneficiaries.remove(beneficiaryId, authHeader)
  } catch (e: any) {
    console.warn('remote delete warning:', e.message)
  }

  return NextResponse.json({ ok: true, deletedId: beneficiaryId })
}
