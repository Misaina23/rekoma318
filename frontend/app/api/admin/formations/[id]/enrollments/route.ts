import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remoteBeneficiaries, remoteFormations } from '@/lib/server/remote'
import {
  getPivotState,
  newId,
  savePivotState,
  type PivotEnrollmentRecord,
} from '@/lib/server/relational'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res
  const formationId = params.id

  try {
    const remote = await remoteFormations.listEnrollments(formationId, authHeader)
    if (remote && Array.isArray(remote.items)) {
      return NextResponse.json(remote, { headers: { 'Cache-Control': 'no-store' } })
    }
  } catch {
    // Fallback to runtime pivot state
  }

  const pivot = await getPivotState()
  const unenrolled = new Set(pivot.unenrolledKeys || [])
  const items = (pivot.enrollments || []).filter(
    (e) => e.formationId === formationId && !unenrolled.has(`${formationId}::${e.beneficiaryId}`)
  )
  return NextResponse.json({ items, total: items.length }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const formationId = params.id
  const body = await req.json().catch(() => null)
  const beneficiaryId = String(body?.beneficiaryId || '').trim()
  if (!beneficiaryId) {
    return NextResponse.json(
      { message: 'Veuillez sélectionner un bénéficiaire à inscrire.' },
      { status: 400 }
    )
  }

  const attendanceStatus = (body?.attendanceStatus || 'enrolled') as PivotEnrollmentRecord['attendanceStatus']
  const evaluationScore =
    body?.evaluationScore !== undefined && body?.evaluationScore !== null && body?.evaluationScore !== ''
      ? Number(body.evaluationScore)
      : null
  const certificateIssued = Boolean(body?.certificateIssued)
  const notes = body?.notes ? String(body.notes).trim() : null

  // Try native PostgreSQL pivot endpoint first
  let remoteSaved: any = null
  try {
    const r = await remoteFormations.enroll(
      formationId,
      { beneficiaryId, attendanceStatus, evaluationScore, certificateIssued, notes },
      authHeader
    )
    remoteSaved = r?.item || r
  } catch (e: any) {
    // If Render hasn't redeployed the new /enrollments route yet (404), keep relational pivot in runtime store
    if (e?.status && e.status !== 404 && e.status < 500) {
      return NextResponse.json({ message: e.message }, { status: e.status })
    }
  }

  // Resolve beneficiary snapshot for instant relational joins
  let beneficiarySnapshot = body?.beneficiary || remoteSaved?.beneficiary || null
  if (!beneficiarySnapshot) {
    try {
      const bList = await remoteBeneficiaries.list(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '1',
        authHeader,
        true
      )
      beneficiarySnapshot = (bList?.items || []).find((x: any) => x.id === beneficiaryId) || null
    } catch {
      beneficiarySnapshot = null
    }
  }

  const pivot = await getPivotState()
  const key = `${formationId}::${beneficiaryId}`
  pivot.unenrolledKeys = (pivot.unenrolledKeys || []).filter((k) => k !== key)

  const record: PivotEnrollmentRecord = {
    id: remoteSaved?.id || newId('enr'),
    formationId,
    beneficiaryId,
    attendanceStatus,
    evaluationScore,
    certificateIssued,
    notes,
    enrolledAt: remoteSaved?.enrolledAt || new Date().toISOString(),
    beneficiary: beneficiarySnapshot
      ? {
          id: beneficiarySnapshot.id,
          firstName: beneficiarySnapshot.firstName,
          lastName: beneficiarySnapshot.lastName,
          cin: beneficiarySnapshot.cin,
          phone: beneficiarySnapshot.phone,
          commune: beneficiarySnapshot.commune,
          fokontany: beneficiarySnapshot.fokontany,
          category: beneficiarySnapshot.category,
          address: beneficiarySnapshot.address,
          status: beneficiarySnapshot.status,
        }
      : undefined,
  }

  const idx = pivot.enrollments.findIndex(
    (e) => e.formationId === formationId && e.beneficiaryId === beneficiaryId
  )
  if (idx >= 0) {
    pivot.enrollments[idx] = { ...pivot.enrollments[idx], ...record }
  } else {
    pivot.enrollments.unshift(record)
  }
  await savePivotState(pivot)

  return NextResponse.json({ ok: true, item: record }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const formationId = params.id
  const body = await req.json().catch(() => null)
  const beneficiaryId = String(body?.beneficiaryId || req.nextUrl.searchParams.get('beneficiaryId') || '').trim()
  if (!beneficiaryId) {
    return NextResponse.json({ message: 'Identifiant du bénéficiaire requis.' }, { status: 400 })
  }

  try {
    await remoteFormations.updateEnrollment(formationId, beneficiaryId, body, authHeader)
  } catch {
    // Sync locally if backend route not yet deployed
  }

  const pivot = await getPivotState()
  const idx = pivot.enrollments.findIndex(
    (e) => e.formationId === formationId && e.beneficiaryId === beneficiaryId
  )
  if (idx >= 0) {
    if (body.attendanceStatus !== undefined) pivot.enrollments[idx].attendanceStatus = body.attendanceStatus
    if (body.evaluationScore !== undefined) {
      pivot.enrollments[idx].evaluationScore =
        body.evaluationScore !== null && body.evaluationScore !== '' ? Number(body.evaluationScore) : null
    }
    if (body.certificateIssued !== undefined) {
      pivot.enrollments[idx].certificateIssued = Boolean(body.certificateIssued)
    }
    if (body.notes !== undefined) pivot.enrollments[idx].notes = body.notes || null
  } else {
    pivot.enrollments.push({
      id: newId('enr'),
      formationId,
      beneficiaryId,
      attendanceStatus: body.attendanceStatus || 'present',
      evaluationScore:
        body.evaluationScore !== undefined && body.evaluationScore !== '' ? Number(body.evaluationScore) : null,
      certificateIssued: Boolean(body.certificateIssued),
      notes: body.notes || null,
      enrolledAt: new Date().toISOString(),
      beneficiary: body.beneficiary,
    })
  }
  await savePivotState(pivot)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_formations')
  if (res) return res

  const formationId = params.id
  const beneficiaryId = String(req.nextUrl.searchParams.get('beneficiaryId') || '').trim()
  if (!beneficiaryId) {
    return NextResponse.json({ message: 'beneficiaryId requis pour la désinscription.' }, { status: 400 })
  }

  try {
    await remoteFormations.unenroll(formationId, beneficiaryId, authHeader)
  } catch {
    // Also unlink legacy Beneficiary.formationId if remote backend is on pre-migration build
    await remoteBeneficiaries.update(beneficiaryId, { formationId: null }, authHeader).catch(() => {})
  }

  const pivot = await getPivotState()
  const key = `${formationId}::${beneficiaryId}`
  if (!pivot.unenrolledKeys.includes(key)) {
    pivot.unenrolledKeys.push(key)
  }
  pivot.enrollments = (pivot.enrollments || []).filter(
    (e) => !(e.formationId === formationId && e.beneficiaryId === beneficiaryId)
  )
  await savePivotState(pivot)

  return NextResponse.json({ ok: true })
}
