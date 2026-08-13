import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  // Super user requested by maintainer
  const email = 'andrianisaina23@gmail.com'
  const plain = '2311saina!'
  const hashed = await bcrypt.hash(plain, 12)

  await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true },
    create: {
      email,
      password: hashed,
      role: 'ADMIN',
      name: 'Super Admin',
      emailVerified: true,
    },
  })

  // example producteurs (idempotent)
  await prisma.producteur.createMany({
    data: [
      { nom: 'Producteur A', description: 'Description A' },
      { nom: 'Producteur B', description: 'Description B' },
    ],
    skipDuplicates: true,
  })

  // Demo formations + beneficiaries (realistic, not marketing filler)
  const formation = await prisma.formation.upsert({
    where: { id: 'seed-formation-pdima-1' },
    update: {},
    create: {
      id: 'seed-formation-pdima-1',
      title: 'Formation agriculture durable PDIMA',
      session: 'Session 2026',
      date: new Date('2026-08-01'),
      participants: 30,
      attendees: 28,
      evaluation: 4.5,
      certificate: true,
      status: 'done',
    },
  })

  await prisma.beneficiary.createMany({
    data: [
      { name: 'Rakoto Jean', category: 'Formation', formationId: formation.id, contact: '+261340000001' },
      { name: 'Rasoamanana Fara', category: 'Distribution', contact: '+261340000002' },
      { name: 'Randrianasolo Mamy', category: 'Emploi', contact: '+261340000003' },
      { name: 'Vololona Tina', category: 'Autre', contact: '+261340000004' },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete — super user:', email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
