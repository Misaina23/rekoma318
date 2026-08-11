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
    update: {},
    create: {
      email,
      password: hashed,
      role: 'ADMIN',
      name: 'Super Admin',
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
