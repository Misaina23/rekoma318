import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/server/guard'
import { remotePersonnel } from '@/lib/server/remote'
import {
  decorateStaffRecord,
  getLocalPersonnel,
  newId,
  saveLocalPersonnel,
} from '@/lib/server/relational'

async function handleUpdate(req: NextRequest, params: { id: string }) {
  const { res, authHeader } = requireAuth(req, 'manage_personnel')
  if (res) return res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Données invalides.' }, { status: 400 })

  try {
    const updated = await remotePersonnel.update(params.id, body, authHeader)
    const item = updated?.item || updated
    if (item?.id) return NextResponse.json(item)
  } catch (e: any) {
    if (e?.status && e.status !== 404 && e.status < 500) {
      return NextResponse.json({ message: e.message }, { status: e.status })
    }
  }

  const all = await getLocalPersonnel()
  const idx = all.findIndex((s) => s.id === params.id && !s.deletedAt)
  if (idx < 0) {
    return NextResponse.json({ message: 'Membre du personnel introuvable.' }, { status: 404 })
  }

  const current = all[idx]
  const contracts = [...(current.contracts || [])]
  if (body.contract && typeof body.contract === 'object') {
    const cPayload = {
      id: body.contract.id || contracts[0]?.id || newId('ctr'),
      staffId: current.id,
      contractType: body.contract.contractType || 'CDD',
      startDate: body.contract.startDate || current.hireDate,
      endDate: body.contract.endDate || null,
      salary: Math.max(0, Number(body.contract.salary) || 0),
      assignmentLocation: body.contract.assignmentLocation?.trim() || null,
      status: body.contract.status || 'active',
      notes: body.contract.notes?.trim() || null,
    }
    if (contracts.length > 0) {
      contracts[0] = cPayload
    } else {
      contracts.push(cPayload)
    }
  }

  const nextRecord = {
    ...current,
    matricule: body.matricule?.trim() || current.matricule,
    firstName: body.firstName !== undefined ? String(body.firstName).trim() : current.firstName,
    lastName: body.lastName !== undefined ? String(body.lastName).trim() : current.lastName,
    cin: body.cin !== undefined ? body.cin?.trim() || null : current.cin,
    sex: body.sex !== undefined ? (body.sex === 'F' ? ('F' as const) : ('M' as const)) : current.sex,
    birthDate: body.birthDate !== undefined ? body.birthDate || null : current.birthDate,
    phone: body.phone !== undefined ? body.phone?.trim() || null : current.phone,
    email: body.email !== undefined ? body.email?.trim() || null : current.email,
    address: body.address !== undefined ? body.address?.trim() || null : current.address,
    position: body.position !== undefined ? String(body.position).trim() : current.position,
    department: body.department !== undefined ? String(body.department).trim() : current.department,
    hireDate: body.hireDate !== undefined ? body.hireDate : current.hireDate,
    status: body.status !== undefined ? body.status : current.status,
    evaluationScore:
      body.evaluationScore !== undefined
        ? body.evaluationScore !== null && body.evaluationScore !== ''
          ? Number(body.evaluationScore)
          : null
        : current.evaluationScore,
    professionalNotes:
      body.professionalNotes !== undefined ? body.professionalNotes?.trim() || null : current.professionalNotes,
    contracts,
    updatedAt: new Date().toISOString(),
  }

  all[idx] = nextRecord
  await saveLocalPersonnel(all)
  return NextResponse.json(decorateStaffRecord(nextRecord))
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return handleUpdate(req, ctx.params)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { res, authHeader } = requireAuth(req, 'manage_personnel')
  if (res) return res

  try {
    await remotePersonnel.remove(params.id, authHeader)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.status && e.status !== 404 && e.status < 500) {
      return NextResponse.json({ message: e.message }, { status: e.status })
    }
  }

  const all = await getLocalPersonnel()
  await saveLocalPersonnel(
    all.map((s) => (s.id === params.id ? { ...s, deletedAt: new Date().toISOString() } : s))
  )
  return NextResponse.json({ ok: true })
}
