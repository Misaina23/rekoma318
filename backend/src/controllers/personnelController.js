import { prisma } from '../lib/prisma.js'
import { ensureRelationalSchema } from '../lib/ensureSchema.js'

const PAGE_SIZE = 5

export const DEPARTMENTS = [
  'Coordination PDIMA',
  'Vulgarisation Agricole',
  'Administration & Finance',
  'Suivi-Évaluation',
  'Logistique & Terrain',
  'Communication & Partenariats',
]

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Consultant', 'Prestation']

function serializeStaff(s) {
  const contracts = Array.isArray(s.contracts) ? s.contracts : []
  const activeContract = contracts.find((c) => c.status === 'active') || contracts[0] || null
  return {
    ...s,
    activeContract,
    contractType: activeContract?.contractType || null,
    salary: activeContract?.salary || 0,
    assignmentLocation: activeContract?.assignmentLocation || null,
    contractStartDate: activeContract?.startDate || null,
    contractEndDate: activeContract?.endDate || null,
  }
}

async function generateNextMatricule() {
  const count = await prisma.staff.count()
  const nextNum = String(count + 1).padStart(3, '0')
  return `REK-RH-${nextNum}-${Math.floor(10 + Math.random() * 89)}`
}

export async function listPersonnel(req, res) {
  await ensureRelationalSchema()
  const { q, department, status, contractType, all, page } = req.query
  const where = { deletedAt: null }

  if (q) {
    const term = String(q).trim()
    where.OR = [
      { matricule: { contains: term, mode: 'insensitive' } },
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { cin: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { position: { contains: term, mode: 'insensitive' } },
      { department: { contains: term, mode: 'insensitive' } },
    ]
  }
  if (department) where.department = String(department)
  if (status) where.status = String(status)
  if (contractType) {
    where.contracts = {
      some: { contractType: String(contractType) },
    }
  }

  const wantAll = String(all) === '1' || String(all) === 'true'
  const pageNum = Math.max(1, Number(page) || 1)
  const skip = wantAll ? 0 : (pageNum - 1) * PAGE_SIZE
  const take = wantAll ? 300 : PAGE_SIZE

  const [rawItems, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        contracts: { orderBy: { startDate: 'desc' } },
        member: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.staff.count({ where }),
  ])

  const items = rawItems.map(serializeStaff)
  res.set('Cache-Control', 'no-store')
  res.json({
    items,
    total,
    page: pageNum,
    pageSize: wantAll ? items.length || PAGE_SIZE : PAGE_SIZE,
    totalPages: wantAll ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

export async function personnelStats(req, res) {
  await ensureRelationalSchema()
  const allStaff = await prisma.staff.findMany({
    where: { deletedAt: null },
    include: { contracts: { orderBy: { startDate: 'desc' } } },
  })

  const total = allStaff.length
  const active = allStaff.filter((s) => s.status === 'active').length
  const onLeave = allStaff.filter((s) => s.status === 'on_leave').length
  const terminated = allStaff.filter((s) => s.status === 'terminated').length

  const byDepartment = {}
  const byContractType = { CDI: 0, CDD: 0, Stage: 0, Consultant: 0, Prestation: 0 }
  let monthlyPayroll = 0
  let activeContractsCount = 0

  for (const s of allStaff) {
    byDepartment[s.department] = (byDepartment[s.department] || 0) + 1
    const activeContract = (s.contracts || []).find((c) => c.status === 'active') || s.contracts?.[0]
    if (activeContract) {
      const ct = activeContract.contractType || 'CDD'
      byContractType[ct] = (byContractType[ct] || 0) + 1
      if (s.status === 'active' && activeContract.status === 'active') {
        activeContractsCount += 1
        monthlyPayroll += Number(activeContract.salary) || 0
      }
    }
  }

  res.set('Cache-Control', 'no-store')
  res.json({
    total,
    active,
    onLeave,
    terminated,
    activeContractsCount,
    monthlyPayroll,
    byDepartment,
    byContractType,
  })
}

export async function createStaff(req, res) {
  await ensureRelationalSchema()
  const {
    matricule,
    firstName,
    lastName,
    cin,
    sex,
    birthDate,
    phone,
    email,
    address,
    position,
    department,
    hireDate,
    status,
    evaluationScore,
    professionalNotes,
    memberId,
    contract,
  } = req.body || {}

  if (!firstName || !lastName || !position) {
    return res.status(400).json({
      success: false,
      error: 'Le nom, le prénom et le poste sont requis.',
    })
  }

  const finalMatricule =
    matricule && String(matricule).trim() ? String(matricule).trim() : await generateNextMatricule()

  try {
    const created = await prisma.staff.create({
      data: {
        matricule: finalMatricule,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        cin: cin && String(cin).trim() ? String(cin).trim() : null,
        sex: sex === 'F' ? 'F' : 'M',
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        address: address ? String(address).trim() : null,
        position: String(position).trim(),
        department: department ? String(department).trim() : 'Coordination PDIMA',
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        status: status || 'active',
        evaluationScore:
          evaluationScore !== undefined && evaluationScore !== null && evaluationScore !== ''
            ? Number(evaluationScore)
            : null,
        professionalNotes: professionalNotes ? String(professionalNotes).trim() : null,
        memberId: memberId || null,
        contracts: contract
          ? {
              create: {
                contractType: contract.contractType || 'CDD',
                startDate: contract.startDate ? new Date(contract.startDate) : hireDate ? new Date(hireDate) : new Date(),
                endDate: contract.endDate ? new Date(contract.endDate) : null,
                salary: Math.max(0, Number(contract.salary) || 0),
                assignmentLocation: contract.assignmentLocation ? String(contract.assignmentLocation).trim() : null,
                status: contract.status || 'active',
                notes: contract.notes ? String(contract.notes).trim() : null,
              },
            }
          : undefined,
      },
      include: {
        contracts: { orderBy: { startDate: 'desc' } },
        member: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })

    res.status(201).json({ success: true, item: serializeStaff(created) })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Ce matricule ou numéro CIN est déjà utilisé par un membre du personnel.',
      })
    }
    throw err
  }
}

export async function updateStaff(req, res) {
  await ensureRelationalSchema()
  const { id } = req.params
  const {
    matricule,
    firstName,
    lastName,
    cin,
    sex,
    birthDate,
    phone,
    email,
    address,
    position,
    department,
    hireDate,
    status,
    evaluationScore,
    professionalNotes,
    memberId,
    contract,
  } = req.body || {}

  const data = {}
  if (matricule !== undefined && String(matricule).trim()) data.matricule = String(matricule).trim()
  if (firstName !== undefined) data.firstName = String(firstName).trim()
  if (lastName !== undefined) data.lastName = String(lastName).trim()
  if (cin !== undefined) data.cin = cin && String(cin).trim() ? String(cin).trim() : null
  if (sex !== undefined) data.sex = sex === 'F' ? 'F' : 'M'
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
  if (phone !== undefined) data.phone = phone ? String(phone).trim() : null
  if (email !== undefined) data.email = email ? String(email).trim() : null
  if (address !== undefined) data.address = address ? String(address).trim() : null
  if (position !== undefined) data.position = String(position).trim()
  if (department !== undefined) data.department = String(department).trim()
  if (hireDate !== undefined) data.hireDate = hireDate ? new Date(hireDate) : new Date()
  if (status !== undefined) data.status = String(status)
  if (evaluationScore !== undefined) {
    data.evaluationScore =
      evaluationScore !== null && evaluationScore !== '' ? Number(evaluationScore) : null
  }
  if (professionalNotes !== undefined) {
    data.professionalNotes = professionalNotes ? String(professionalNotes).trim() : null
  }
  if (memberId !== undefined) data.memberId = memberId || null

  try {
    await prisma.staff.update({ where: { id }, data })

    if (contract && typeof contract === 'object') {
      const existingContract = contract.id
        ? await prisma.employmentContract.findUnique({ where: { id: contract.id } })
        : await prisma.employmentContract.findFirst({
            where: { staffId: id, status: 'active' },
            orderBy: { startDate: 'desc' },
          })

      const contractPayload = {
        contractType: contract.contractType || 'CDD',
        startDate: contract.startDate ? new Date(contract.startDate) : new Date(),
        endDate: contract.endDate ? new Date(contract.endDate) : null,
        salary: Math.max(0, Number(contract.salary) || 0),
        assignmentLocation: contract.assignmentLocation ? String(contract.assignmentLocation).trim() : null,
        status: contract.status || 'active',
        notes: contract.notes ? String(contract.notes).trim() : null,
      }

      if (existingContract) {
        await prisma.employmentContract.update({
          where: { id: existingContract.id },
          data: contractPayload,
        })
      } else {
        await prisma.employmentContract.create({
          data: {
            staffId: id,
            ...contractPayload,
          },
        })
      }
    }

    const refreshed = await prisma.staff.findUnique({
      where: { id },
      include: {
        contracts: { orderBy: { startDate: 'desc' } },
        member: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })

    res.json({ success: true, item: serializeStaff(refreshed) })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Ce matricule ou numéro CIN est déjà utilisé par un membre du personnel.',
      })
    }
    throw err
  }
}

export async function deleteStaff(req, res) {
  await ensureRelationalSchema()
  await prisma.staff.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })
  res.json({ success: true })
}

export async function addStaffContract(req, res) {
  await ensureRelationalSchema()
  const staffId = req.params.id
  const { contractType, startDate, endDate, salary, assignmentLocation, status, notes } = req.body || {}
  if ((status || 'active') === 'active') {
    await prisma.employmentContract.updateMany({
      where: { staffId, status: 'active' },
      data: { status: 'expired' },
    })
  }
  const item = await prisma.employmentContract.create({
    data: {
      staffId,
      contractType: contractType || 'CDD',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      salary: Math.max(0, Number(salary) || 0),
      assignmentLocation: assignmentLocation ? String(assignmentLocation).trim() : null,
      status: status || 'active',
      notes: notes ? String(notes).trim() : null,
    },
  })
  res.status(201).json({ success: true, item })
}
